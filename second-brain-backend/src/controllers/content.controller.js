import mongoose from "mongoose"
import { createHash } from "node:crypto"
import contentModel from "../models/content.model.js"
import { generateStructuredTags } from "../services/aiTagging.service.js"
import { splitText } from "../services/chunk.service.js"
import { cleanupContentArtifacts, clearUserContentByUserId } from "../services/content-cleanup.service.js"
import { embedText, generateEmbeddings } from "../services/embedding.service.js"
import { detectUploadFileType, extractFileContent } from "../services/extract.service.js"
import { getMetadata } from "../services/metadata.service.js"
import { resolveUploadMetadata } from "../services/upload-metadata.service.js"
import { deleteFileFromImageKit, uploadFileToImageKit } from "../services/upload.service.js"
import { isYouTubeUrl, normalizeYouTubeUrl } from "../utils/youtube.util.js"
import {
    deleteVectorsFromPinecone,
    storeVectorsInPinecone,
} from "../services/vector.service.js"

const minimumIndexableCharacters = 20
const maxContentEmbeddingBodyCharacters = 3600

// Saves URL-based content by scraping metadata from the target page.
// Input: Express request with `req.body.url`, optional `req.body.title`, and authenticated `req.user.id`.
// Output: JSON response containing the created content document.
export async function saveContentController(req, res) {
    // Store vector IDs so we can rollback if something fails later
    let vectorIds = []

    try {
        const { url, title, description = "", image = "" } = req.body

        // ❌ Validation: URL is required
        if (!url) {
            return res.status(400).json({ message: "URL is required" })
        }

        const userId = String(req.user.id)
        const normalizedRequestedUrl = normalizeComparableUrl(url)
        const existingSavedContent = await findExistingUrlContent({
            userId,
            rawUrl: url,
            normalizedUrl: normalizedRequestedUrl,
        })

        if (existingSavedContent) {
            return respondWithDuplicateContent(res, {
                content: existingSavedContent,
                fallbackMessage: "This link is already in your archive.",
            })
        }

        // 🔍 STEP 1: Fetch metadata from URL (title, description, image, etc.)
        const meta = await getMetadata(url)
        const resolvedUrl = meta.url || url
        const normalizedResolvedUrl = normalizeComparableUrl(resolvedUrl)
        const existingResolvedContent = await findExistingUrlContent({
            userId,
            rawUrl: resolvedUrl,
            normalizedUrl: normalizedResolvedUrl,
        })

        if (existingResolvedContent) {
            return respondWithDuplicateContent(res, {
                content: existingResolvedContent,
                fallbackMessage: "This link is already in your archive.",
            })
        }

        // 🆔 STEP 2: Create MongoDB ID early (used for vector linking)
        const contentObjectId = new mongoose.Types.ObjectId()
        const contentId = contentObjectId.toString()

        // 🏷️ STEP 3: Resolve final title
        const resolvedTitle = title || meta.title || "No title"
        const resolvedDescription = meta.description || String(description || "").trim()
        const resolvedImage = meta.image || String(image || "").trim()

        // 🧠 STEP 4: Build searchable text (used for embeddings + AI)
        const indexableText = buildSavedContentIndexText({
            title: resolvedTitle,
            description: resolvedDescription,
            tags: meta.tags,
            type: meta.type,
            url: resolvedUrl,
            bodyText: meta.indexText,
        })
        const contentEmbeddingText = buildContentEmbeddingText({
            title: resolvedTitle,
            description: resolvedDescription,
            tags: meta.tags,
            type: meta.type,
            url: resolvedUrl,
            bodyText: meta.transcriptText,
        })

        let chunks = []
        let fullEmbedding = []
        let vectorReady = false

        // ============================================
        // 🔷 STEP 5: VECTOR PIPELINE (RAG FOUNDATION)
        // ============================================

        // Only process if text is meaningful
        if (hasIndexableText(indexableText)) {
            // Store one embedding for the full item so the graph layer can compare saved content.
            fullEmbedding = await embedText(contentEmbeddingText)

            // ✂️ Split text into smaller chunks (better for search)
            chunks = await splitText(indexableText)

            if (chunks.length) {

                // 🧬 Convert chunks → embeddings (vectors)
                const embeddings = await generateEmbeddings(chunks)

                // 📦 Store vectors in Pinecone with metadata
                vectorIds = await storeVectorsInPinecone({
                    embeddings,
                    chunks,
                    metadata: {
                        userId,                 // 🔐 Used for filtering user data
                        title: resolvedTitle,
                        contentId,              // 🔗 Link to MongoDB
                        type: meta.type || "article",
                        url: resolvedUrl,
                        image: resolvedImage,
                    },
                })

                // ✅ Check if all vectors stored successfully
                vectorReady = vectorIds.length === chunks.length
            }
        }

        // ============================================
        // 🧠 STEP 6: AI TAGGING (SMART ORGANIZATION)
        // ============================================

        const aiTags = hasIndexableText(indexableText)
            ? await generateStructuredTags(indexableText)
            : {
                category: "General",
                subCategory: "Misc",
                tags: []
            }

        // ============================================
        // 🏷️ STEP 7: MERGE TAGS (AI + METADATA)
        // ============================================

        const finalTags = [
            ...(meta.tags || []),      // existing tags
            ...(aiTags.tags || [])     // AI-generated tags
        ]
            .map(tag => String(tag).toLowerCase().trim())
            .filter(Boolean)

        // Remove duplicates & limit size
        const uniqueTags = [...new Set(finalTags)].slice(0, 10)

        // ============================================
        // 💾 STEP 8: SAVE TO DATABASE
        // ============================================

        const content = await contentModel.create({
            _id: contentObjectId,

            url: resolvedUrl,
            normalizedUrl: normalizedResolvedUrl,
            title: resolvedTitle,
            description: resolvedDescription,
            descriptionLanguage: meta.descriptionLanguage || "",
            summary: resolvedDescription,

            image: resolvedImage,
            type: meta.type || "article",

            // 🔥 AI-powered structure
            tags: uniqueTags,
            category: aiTags.category,
            subCategory: aiTags.subCategory,

            userId,

            // 🔗 Vector mapping
            contentId,
            textChunks: chunks,
            embedding: fullEmbedding,
            vectorReady,
            vectorIds,
        })
        

        // ✅ SUCCESS RESPONSE
        return res.status(201).json({
            success: true,
            data: sanitizeContentDocument(content),
        })

    } catch (error) {

        // ============================================
        // 🧹 CLEANUP: REMOVE VECTORS IF FAILED
        // ============================================

        if (vectorIds.length) {
            try {
                await deleteVectorsFromPinecone(vectorIds)
            } catch (cleanupError) {
                console.error("Save Content Vector Cleanup Error:", cleanupError.message)
            }
        }

        console.error("Save Content Error:", error.message)

        return res.status(500).json({
            success: false,
            message: resolveContentMutationErrorMessage(error, "Failed to save content"),
        })
    }
}

// Uploads a PDF or image, extracts text, generates embeddings, stores vectors, uploads the file, and saves Mongo metadata.
// Input: Express request with `req.file` from multer, optional `req.body.title`, and authenticated `req.user.id`.
// Output: JSON response containing the created content document.
export async function uploadContentController(req, res) {
    // Keep track of stored vector ids so we can clean them up if a later step fails.
    let vectorIds = []
    let uploadedFileId = ""

    try {
        const file = req.file

        if (!file) {
            return res.status(400).json({ message: "File is required" })
        }

        const uploadType = detectUploadFileType(file)

        if (!uploadType) {
            return res.status(400).json({ message: "Only PDF or image files are supported" })
        }

        const userId = String(req.user.id)
        const fileHash = createFileHash(file)
        const existingUploadedContent = await findExistingUploadedContent({
            userId,
            fileHash,
        })

        if (existingUploadedContent) {
            return respondWithDuplicateContent(res, {
                content: existingUploadedContent,
                fallbackMessage: "This file is already in your archive.",
            })
        }

        // Create the Mongo id before vector storage so Pinecone metadata can point back to this document.
        const contentObjectId = new mongoose.Types.ObjectId()
        const contentId = contentObjectId.toString()

        // Extract raw text first because chunking, embeddings, and AI metadata all depend on it.
        const extractedFileContent = await extractFileContent(file)
        const text = normalizeExtractedText(extractedFileContent?.text)
        // Generate hierarchical tags from the extracted text.
        // The service falls back safely when OCR text is empty or the model fails.
        const aiTags = await generateStructuredTags(text)

        // Build the user-facing title, description, and tags from OCR/PDF text plus file context.
        const uploadMetadata = await resolveUploadMetadata({
            manualTitle: req.body?.title,
            originalName: file.originalname,
            uploadType,
            extractedText: text,
            ocrConfidence: extractedFileContent?.ocrConfidence,
        })
        // Upload the file before vector storage so Pinecone metadata can keep the real public URL and preview image.
        const uploadedFile = await uploadFileToImageKit(file, {
            userId,
            uploadType,
        })

        uploadedFileId = String(uploadedFile?.fileId || "").trim()

        if (!uploadedFile?.url) {
            throw new Error("ImageKit did not return a public file URL")
        }

        const previewImage = uploadType === "image"
            ? uploadedFile.url
            : uploadedFile.thumbnailUrl || ""
        const resolvedUploadTags = resolveUploadTags(aiTags?.tags, uploadMetadata.tags)
        const uploadEmbeddingText = buildContentEmbeddingText({
            title: uploadMetadata.title,
            description: uploadMetadata.description,
            tags: resolvedUploadTags,
            type: uploadType,
            url: uploadedFile.url,
            bodyText: text,
        })

        let chunks = []
        let fullEmbedding = []
        let vectorReady = false

        // Only vectorize files with enough readable text to be useful for semantic search.
        if (hasIndexableText(text)) {
            // Store one document-level embedding alongside the chunk vectors for graph relationships.
            fullEmbedding = await embedText(uploadEmbeddingText)

            // Split large text into smaller retrieval-friendly chunks.
            chunks = await splitText(text)

            if (chunks.length) {
                // Generate one embedding per chunk.
                const embeddings = await generateEmbeddings(chunks)

                // Store chunk vectors with Mongo mapping metadata.
                vectorIds = await storeVectorsInPinecone({
                    embeddings,
                    chunks,
                    metadata: {
                        userId,
                        title: uploadMetadata.title,
                        contentId,//!in model also wer are saving the _id is content id 
                        type: uploadType,
                        url: uploadedFile.url,
                        image: previewImage,
                    },
                })

                vectorReady = vectorIds.length === chunks.length
            }
        }

        // Save the final content document with both UI metadata and vector mapping fields.
        const content = await contentModel.create({
            _id: contentObjectId,//!ths the game changer we are fetch result from pincode by this 
            userId,
            title: uploadMetadata.title,
            description: uploadMetadata.description,
            descriptionLanguage: uploadMetadata.descriptionLanguage || "",
            summary: uploadMetadata.description,
            image: previewImage,
            tags: resolvedUploadTags,
            category: aiTags.category,
            subCategory: aiTags.subCategory,
            type: uploadType,
            url: uploadedFile.url,
            normalizedUrl: normalizeComparableUrl(uploadedFile.url),
            fileHash,
            textChunks: chunks,
            embedding: fullEmbedding,
            vectorReady,
            contentId,
            vectorIds,
            fileStorageId: uploadedFileId,
        })

        return res.status(201).json({
            success: true,
            data: sanitizeContentDocument(content),
        })
    } catch (error) {
        // If Mongo/ImageKit fails after Pinecone succeeds, remove those vectors to avoid stale search records.
        if (vectorIds.length) {
            try {
                await deleteVectorsFromPinecone(vectorIds)
            } catch (cleanupError) {
                console.error("Upload Vector Cleanup Error:", cleanupError.message)
            }
        }

        // Remove the uploaded asset too when the pipeline fails after ImageKit upload succeeds.
        if (uploadedFileId) {
            try {
                await deleteFileFromImageKit(uploadedFileId)
            } catch (cleanupError) {
                console.error("Upload File Cleanup Error:", cleanupError.message)
            }
        }

        console.error("Upload Content Error:", error.message)

        const statusCode = resolveUploadErrorStatus(error)
        const message = resolveContentMutationErrorMessage(error, "Failed to upload content")

        return res.status(statusCode).json({
            success: false,
            message,
        })
    }
}

// Fetches all saved content for the authenticated user.
// Input: Express request with authenticated `req.user.id`.
// Output: JSON response containing an array of content documents.
export async function getContentAllController(req, res, next) {
    try {
        const contents = await contentModel.find({ userId: String(req.user.id) }).sort({ createdAt: -1 })
        return res.status(200).json({
            success: true,
            data: contents.map(content => sanitizeContentDocument(content)),
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: error.message })
    }
}

// Deletes one content record owned by the authenticated user.
// Input: Express request with `req.params.id` and authenticated `req.user.id`.
// Output: JSON response containing the deleted document when successful.
export async function DeleteContentController(req, res, next) {
    try {
        const contentId = req.params.id
        const deletedContent = await contentModel.findOneAndDelete({ _id: contentId, userId: String(req.user.id) })

        if (!deletedContent) {
            return res.status(404).json({ message: "Content not found or not authorized" })
        }

        await cleanupContentArtifacts(deletedContent)

        return res.status(200).json({
            success: true,
            message: "Content deleted successfully",
            data: sanitizeContentDocument(deletedContent),
        })
    } catch (error) {
        console.error("Delete Content Error:", error.message)
        return res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}

// Deletes every saved item for the authenticated user and clears related vectors/uploaded files.
// Input: Express request with authenticated `req.user.id`.
// Output: JSON response containing the deleted item count.
export async function clearAllContentController(req, res, next) {
    try {
        const result = await clearUserContentByUserId(String(req.user.id))

        return res.status(200).json({
            success: true,
            message: result.deletedCount
                ? `Cleared ${result.deletedCount} saved item${result.deletedCount === 1 ? "" : "s"} from your archive`
                : "Your archive was already empty",
            data: {
                deletedCount: result.deletedCount,
            },
        })
    } catch (error) {
        console.error("Clear All Content Error:", error.message)
        return res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}

// Fetches the current user's saved content without applying extra filters.
// Input: Express request with authenticated `req.user.id`.
// Output: JSON response containing an array of saved content documents.
export async function getSingleUserContentController(req, res, next) {
    try {
        const id = String(req.user.id)
        const content = await contentModel.find({ userId: id }).sort({ createdAt: -1 })
        return res.status(200).json({
            success: true,
            data: content.map(item => sanitizeContentDocument(item)),
        })
    } catch (error) {
        console.error("Get Single User Content Error:", error.message)
        return res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}

// Proxies third-party preview images through the backend so blocked hotlinks still render on the frontend.
// Input: Express request with `req.query.url` and optional `req.query.source`.
// Output: proxied image bytes or a JSON error response.
export async function proxyContentImageController(req, res) {
    try {
        const imageUrl = String(req.query.url || "").trim()
        const sourceUrl = String(req.query.source || "").trim()

        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                message: "Image URL is required",
            })
        }

        let parsedImageUrl

        try {
            parsedImageUrl = new URL(imageUrl)
        } catch {
            return res.status(400).json({
                success: false,
                message: "Invalid image URL",
            })
        }

        if (!["http:", "https:"].includes(parsedImageUrl.protocol)) {
            return res.status(400).json({
                success: false,
                message: "Only HTTP(S) image URLs are supported",
            })
        }

        if (isBlockedProxyHost(parsedImageUrl.hostname)) {
            return res.status(400).json({
                success: false,
                message: "Unsupported image host",
            })
        }

        const referer = getSafeReferer(sourceUrl, parsedImageUrl)
        const response = await fetch(parsedImageUrl, {
            headers: {
                "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                "accept-language": "en-US,en;q=0.9",
                "referer": referer,
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
            },
            redirect: "follow",
        })

        if (!response.ok) {
            return res.status(502).json({
                success: false,
                message: "Failed to fetch image preview",
            })
        }

        const contentType = String(response.headers.get("content-type") || "").toLowerCase()

        if (!contentType.startsWith("image/")) {
            return res.status(415).json({
                success: false,
                message: "Preview URL did not return an image",
            })
        }

        const cacheControl = response.headers.get("cache-control")
        const contentLength = response.headers.get("content-length")
        const imageBuffer = Buffer.from(await response.arrayBuffer())

        res.setHeader("Content-Type", contentType)
        res.setHeader("Cache-Control", cacheControl || "public, max-age=86400")

        if (contentLength) {
            res.setHeader("Content-Length", contentLength)
        }

        return res.status(200).send(imageBuffer)
    } catch (error) {
        console.error("Image Proxy Error:", error.message)
        return res.status(502).json({
            success: false,
            message: "Failed to load image preview",
        })
    }
}

// Resolves a safe referer header for the image proxy fetch request.
// Input: original source page URL and parsed image URL.
// Output: referer string used in the outbound fetch.
function getSafeReferer(sourceUrl, parsedImageUrl) {
    try {
        if (sourceUrl) {
            const parsedSourceUrl = new URL(sourceUrl)

            if (["http:", "https:"].includes(parsedSourceUrl.protocol)) {
                return parsedSourceUrl.origin + "/"
            }
        }
    } catch {
        // Ignore malformed source URLs and fall back to the image host origin.
    }

    return parsedImageUrl.origin + "/"
}

// Prevents the proxy endpoint from being used against localhost or private-network destinations.
// Input: hostname string from the requested image URL.
// Output: boolean indicating whether the host should be blocked.
function isBlockedProxyHost(hostname) {
    const normalizedHost = String(hostname || "").toLowerCase()

    if (!normalizedHost) {
        return true
    }

    if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(normalizedHost)) {
        return true
    }

    if (/^10\.\d+\.\d+\.\d+$/.test(normalizedHost)) {
        return true
    }

    if (/^192\.168\.\d+\.\d+$/.test(normalizedHost)) {
        return true
    }

    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(normalizedHost)) {
        return true
    }

    return false
}

// Maps known upload failures to a response status that matches the root cause.
// Input: thrown error from upload/extract/AI services.
// Output: HTTP status code for the API response.
function resolveUploadErrorStatus(error) {
    const message = String(error?.message || "")

    if (
        message.includes("Only PDF or image files are supported")
        || message.includes("File is required")
        || message.includes("Unsupported file type")
        || message.includes("Search query is required")
    ) {
        return 400
    }

    return 500
}

// Converts low-level content mutation errors into readable API messages for the frontend or API client.
// Input: thrown error from upload/save/vector services plus a fallback message.
// Output: safe response message string.
function resolveContentMutationErrorMessage(error, fallbackMessage) {
    const message = String(error?.message || "")

    if (message.includes("IMAGEKIT_PRIVATE_KEY")) {
        return message
    }

    if (message.includes("Your account cannot be authenticated")) {
        return "ImageKit authentication failed. Check that IMAGEKIT_PRIVATE_KEY contains your ImageKit private key, not the public key."
    }

    if (message.includes("MISTRAL_API_KEY")) {
        return "Mistral API key is missing or invalid."
    }

    if (message.includes("PINECONE_")) {
        return "Pinecone is not configured correctly for vector storage."
    }

    if (message.includes("Pinecone")) {
        return "Failed to store or clean up vectors in Pinecone."
    }

    return fallbackMessage
}

// Normalizes extracted text before validation and chunking.
// Input: raw OCR/PDF text.
// Output: cleaned text string.
function normalizeExtractedText(text) {
    return String(text || "")
        .replace(/\u0000/g, " ")
        .replace(/\r/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
}

// Determines whether extracted text is substantial enough to embed and index.
// Input: normalized extracted text.
// Output: boolean indicating whether vectorization should proceed.
function hasIndexableText(text) {
    const normalizedText = normalizeExtractedText(text)
    return normalizedText.length >= minimumIndexableCharacters
}

// Builds a compact retrieval text block for saved URLs so links can also be embedded and searched.
// Input: normalized metadata for a saved URL.
// Output: one chunkable text string for vector indexing.
function buildSavedContentIndexText({ title, description, tags, type, url, bodyText = "" }) {
    return normalizeExtractedText([
        title ? `Title: ${title}` : "",
        description ? `Description: ${description}` : "",
        Array.isArray(tags) && tags.length ? `Tags: ${tags.join(", ")}` : "",
        type ? `Type: ${type}` : "",
        url ? `Source URL: ${url}` : "",
        bodyText ? `Body: ${bodyText}` : "",
    ].filter(Boolean).join("\n"))
}

// Builds a bounded content-level embedding payload so large transcripts and PDFs stay graph-searchable without exceeding model limits.
// Input: normalized content metadata plus optional long body text.
// Output: compact text string safe for one content-level embedding request.
function buildContentEmbeddingText({ title, description, tags, type, url, bodyText = "" }) {
    const normalizedBodyText = normalizeExtractedText(bodyText).slice(0, maxContentEmbeddingBodyCharacters)

    return normalizeExtractedText([
        title ? `Title: ${title}` : "",
        description ? `Description: ${description}` : "",
        Array.isArray(tags) && tags.length ? `Tags: ${tags.join(", ")}` : "",
        type ? `Type: ${type}` : "",
        url ? `Source URL: ${url}` : "",
        normalizedBodyText ? `Body: ${normalizedBodyText}` : "",
    ].filter(Boolean).join("\n"))
}

// Prefers structured AI tags but falls back to the existing metadata tag pipeline when needed.
// Input: structured tag array and the upload-metadata fallback tags.
// Output: deduplicated tag array safe to save in MongoDB.
function resolveUploadTags(structuredTags, fallbackTags) {
    const normalizedTags = [
        ...(Array.isArray(structuredTags) ? structuredTags : []),
        ...(Array.isArray(fallbackTags) ? fallbackTags : []),
    ]
        .map(tag => String(tag || "").toLowerCase().trim())
        .filter(Boolean)

    return [...new Set(normalizedTags)].slice(0, 10)
}

// Removes internal-only fields before newly created content documents are returned to the client.
// Input: Mongoose document or plain object.
// Output: plain content object safe for API responses.
function sanitizeContentDocument(content) {
    const normalizedContent = typeof content?.toObject === "function"
        ? content.toObject()
        : { ...(content || {}) }

    delete normalizedContent.embedding
    delete normalizedContent.fileHash
    delete normalizedContent.normalizedUrl

    return normalizedContent
}

// Finds an existing saved URL for the same user using both raw and normalized URL forms.
// Input: authenticated user id plus raw and normalized URL candidates.
// Output: matching content document or null.
async function findExistingUrlContent({ userId, rawUrl, normalizedUrl }) {
    const candidates = [rawUrl, normalizedUrl]
        .map(value => String(value || "").trim())
        .filter(Boolean)
    const uniqueCandidates = [...new Set(candidates)]

    if (!uniqueCandidates.length) {
        return null
    }

    return contentModel.findOne({
        userId,
        $or: [
            { normalizedUrl: { $in: uniqueCandidates } },
            { url: { $in: uniqueCandidates } },
        ],
    }).sort({ createdAt: -1 })
}

// Finds an existing uploaded file for the same user using the computed file hash.
// Input: authenticated user id and SHA-256 file hash string.
// Output: matching content document or null.
async function findExistingUploadedContent({ userId, fileHash }) {
    const normalizedFileHash = String(fileHash || "").trim()

    if (!normalizedFileHash) {
        return null
    }

    return contentModel.findOne({
        userId,
        fileHash: normalizedFileHash,
    }).sort({ createdAt: -1 })
}

// Returns a successful duplicate response so the UI can show when the original save happened.
// Input: Express response plus the matching content document and fallback message.
// Output: duplicate-aware JSON response.
function respondWithDuplicateContent(res, { content, fallbackMessage }) {
    return res.status(200).json({
        success: true,
        duplicate: true,
        message: buildDuplicateContentMessage(content, fallbackMessage),
        data: sanitizeContentDocument(content),
    })
}

// Formats a duplicate-save message that includes the original saved date when available.
// Input: existing content document and fallback message string.
// Output: user-facing duplicate message.
function buildDuplicateContentMessage(content, fallbackMessage) {
    const savedDateLabel = formatSavedDate(content?.createdAt)
    return savedDateLabel ? `You already saved this on ${savedDateLabel}.` : fallbackMessage
}

// Builds a comparable URL key by removing tracking params and normalizing host/path details.
// Input: raw URL string.
// Output: normalized URL string or the trimmed input when parsing fails.
function normalizeComparableUrl(url) {
    const trimmedUrl = String(url || "").trim()

    if (!trimmedUrl) {
        return ""
    }

    if (isYouTubeUrl(trimmedUrl)) {
        return normalizeYouTubeUrl(trimmedUrl)
    }

    try {
        const parsedUrl = new URL(trimmedUrl)
        const searchParams = new URLSearchParams(parsedUrl.search)
        const removableParams = new Set(["fbclid", "gclid", "igshid", "mc_cid", "mc_eid", "ref", "si"])

        Array.from(searchParams.keys()).forEach(key => {
            const normalizedKey = String(key || "").toLowerCase()

            if (normalizedKey.startsWith("utm_") || removableParams.has(normalizedKey)) {
                searchParams.delete(key)
            }
        })

        const sortedParams = [...searchParams.entries()].sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))

        parsedUrl.hash = ""
        parsedUrl.protocol = parsedUrl.protocol.toLowerCase()
        parsedUrl.hostname = parsedUrl.hostname.toLowerCase()

        if (
            (parsedUrl.protocol === "http:" && parsedUrl.port === "80")
            || (parsedUrl.protocol === "https:" && parsedUrl.port === "443")
        ) {
            parsedUrl.port = ""
        }

        parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, "") || "/"
        parsedUrl.search = sortedParams.length ? `?${new URLSearchParams(sortedParams).toString()}` : ""

        return parsedUrl.toString()
    } catch {
        return trimmedUrl
    }
}

// Computes a stable hash for uploaded files so exact duplicates can be detected before upload.
// Input: multer file object.
// Output: SHA-256 hex digest string.
function createFileHash(file) {
    return file?.buffer ? createHash("sha256").update(file.buffer).digest("hex") : ""
}

// Formats a readable saved date for duplicate-save messaging.
// Input: raw createdAt value.
// Output: formatted date string or empty string.
function formatSavedDate(value) {
    const parsedDate = value instanceof Date ? value : new Date(value)

    if (Number.isNaN(parsedDate.getTime())) {
        return ""
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(parsedDate)
}
