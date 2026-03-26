import mongoose from "mongoose"
import contentModel from "../models/content.model.js"
import { generateStructuredTags } from "../services/aiTagging.service.js"
import { splitText } from "../services/chunk.service.js"
import { embedText, generateEmbeddings } from "../services/embedding.service.js"
import { detectUploadFileType, extractFileContent } from "../services/extract.service.js"
import { getMetadata } from "../services/metadata.service.js"
import { resolveUploadMetadata } from "../services/upload-metadata.service.js"
import { deleteFileFromImageKit, uploadFileToImageKit } from "../services/upload.service.js"
import {
    buildVectorIds,
    deleteVectorsFromPinecone,
    storeVectorsInPinecone,
} from "../services/vector.service.js"

const minimumIndexableCharacters = 20

// Saves URL-based content by scraping metadata from the target page.
// Input: Express request with `req.body.url`, optional `req.body.title`, and authenticated `req.user.id`.
// Output: JSON response containing the created content document.
export async function saveContentController(req, res) {
    // Store vector IDs so we can rollback if something fails later
    let vectorIds = []

    try {
        const { url, title } = req.body

        // ❌ Validation: URL is required
        if (!url) {
            return res.status(400).json({ message: "URL is required" })
        }

        const userId = String(req.user.id)

        // 🔍 STEP 1: Fetch metadata from URL (title, description, image, etc.)
        const meta = await getMetadata(url)
        const resolvedUrl = meta.url || url

        // 🆔 STEP 2: Create MongoDB ID early (used for vector linking)
        const contentObjectId = new mongoose.Types.ObjectId()
        const contentId = contentObjectId.toString()

        // 🏷️ STEP 3: Resolve final title
        const resolvedTitle = title || meta.title || "No title"

        // 🧠 STEP 4: Build searchable text (used for embeddings + AI)
        const indexableText = buildSavedContentIndexText({
            title: resolvedTitle,
            description: meta.description,
            tags: meta.tags,
            type: meta.type,
            url: resolvedUrl,
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
            fullEmbedding = await embedText(indexableText)

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
                        image: meta.image || "",
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
            title: resolvedTitle,
            description: meta.description || "",
            summary: meta.description || "",

            image: meta.image || "",
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

        let chunks = []
        let fullEmbedding = []
        let vectorReady = false

        // Only vectorize files with enough readable text to be useful for semantic search.
        if (hasIndexableText(text)) {
            // Store one document-level embedding alongside the chunk vectors for graph relationships.
            fullEmbedding = await embedText(text)

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
                        contentId,
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
            _id: contentObjectId,
            userId,
            title: uploadMetadata.title,
            description: uploadMetadata.description,
            summary: uploadMetadata.description,
            image: previewImage,
            tags: resolveUploadTags(aiTags?.tags, uploadMetadata.tags),
            category: aiTags.category,
            subCategory: aiTags.subCategory,
            type: uploadType,
            url: uploadedFile.url,
            textChunks: chunks,
            embedding: fullEmbedding,
            vectorReady,
            contentId,
            vectorIds,
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
            data: contents,
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

        const storedVectorIds = deletedContent.vectorIds?.length
            ? deletedContent.vectorIds
            : deletedContent.contentId
                ? buildVectorIds(deletedContent.contentId, deletedContent.textChunks?.length)
                : []

        // Delete the matching vectors as part of content cleanup.
        if (storedVectorIds.length) {
            try {
                await deleteVectorsFromPinecone(storedVectorIds)
            } catch (cleanupError) {
                console.error("Delete Vector Cleanup Error:", cleanupError.message)
            }
        }

        return res.status(200).json({
            success: true,
            message: "Content deleted successfully",
            data: deletedContent,
        })
    } catch (error) {
        console.error("Delete Content Error:", error.message)
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
            data: content,
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
function buildSavedContentIndexText({ title, description, tags, type, url }) {
    return normalizeExtractedText([
        title ? `Title: ${title}` : "",
        description ? `Description: ${description}` : "",
        Array.isArray(tags) && tags.length ? `Tags: ${tags.join(", ")}` : "",
        type ? `Type: ${type}` : "",
        url ? `Source URL: ${url}` : "",
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

    return normalizedContent
}
