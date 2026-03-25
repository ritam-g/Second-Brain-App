import contentModel from "../models/content.model.js"
import { detectUploadFileType, extractFileContent } from "../services/extract.service.js"
import { getMetadata } from "../services/metadata.service.js"
import { resolveUploadMetadata } from "../services/upload-metadata.service.js"
import { uploadFileToImageKit } from "../services/upload.service.js"

// Saves URL-based content by scraping metadata from the target page.
// Input: Express request with `req.body.url`, optional `req.body.title`, and authenticated `req.user.id`.
// Output: JSON response containing the created content document.
export async function saveContentController(req, res) {
    try {
        const { url, title } = req.body

        if (!url) {
            return res.status(400).json({ message: "URL is required" })
        }

        const meta = await getMetadata(url)
        const content = await contentModel.create({
            url,
            title: title || meta.title || "No title",
            description: meta.description || "",
            image: meta.image || "",
            type: meta.type || "article",
            tags: meta.tags || [],
            userId: req.user.id,
        })

        return res.status(201).json({
            success: true,
            data: content,
        })
    } catch (error) {
        console.error("Save Content Error:", error.message)

        return res.status(500).json({
            success: false,
            message: "Failed to save content",
        })
    }
}

// Uploads a PDF or image, extracts text, generates AI tags, and stores the result as saved content.
// Input: Express request with `req.file` from multer, optional `req.body.title`, and authenticated `req.user.id`.
// Output: JSON response containing the created content document.
export async function uploadContentController(req, res) {
    try {
        const file = req.file

        if (!file) {
            return res.status(400).json({ message: "File is required" })
        }

        const uploadType = detectUploadFileType(file)

        if (!uploadType) {
            return res.status(400).json({ message: "Only PDF or image files are supported" })
        }

        const extractedFileContent = await extractFileContent(file)
        const uploadedFile = await uploadFileToImageKit(file, {
            userId: req.user.id,
            uploadType,
        })

        if (!uploadedFile?.url) {
            throw new Error("ImageKit did not return a public file URL")
        }

        const uploadMetadata = await resolveUploadMetadata({
            manualTitle: req.body?.title,
            originalName: file.originalname,
            uploadType,
            extractedText: extractedFileContent.text,
            ocrConfidence: extractedFileContent.ocrConfidence,
        })

        const content = await contentModel.create({
            userId: req.user.id,
            title: uploadMetadata.title,
            description: uploadMetadata.description,
            image: uploadType === "image" ? uploadedFile.url : uploadedFile.thumbnailUrl || "",
            tags: uploadMetadata.tags,
            type: uploadType,
            url: uploadedFile.url,
        })

        return res.status(201).json({
            success: true,
            data: content,
        })
    } catch (error) {
        console.error("Upload Content Error:", error.message)

        const statusCode = resolveUploadErrorStatus(error)
        const message = resolveUploadErrorMessage(error)

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
        const contents = await contentModel.find({ userId: req.user.id }).sort({ createdAt: -1 })
        return res.status(200).json({
            success: true,
            data: contents
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
        const deletedContent = await contentModel.findOneAndDelete({ _id: contentId, userId: req.user.id })
        if (!deletedContent) {
            return res.status(404).json({ message: "Content not found or not authorized" })
        }
        return res.status(200).json({
            success: true,
            message: "Content deleted successfully",
            data: deletedContent
        })
    } catch (error) {
        console.error("Delete Content Error:", error.message)
        return res.status(500).json({
            success: false,
            error: error.message
        })
    }
}

// Fetches the current user's saved content without applying extra filters.
// Input: Express request with authenticated `req.user.id`.
// Output: JSON response containing an array of saved content documents.
export async function getSingleUserContentController(req, res, next) {
    try {
        const id = req.user.id
        const content = await contentModel.find({ userId: id }).sort({ createdAt: -1 })
        return res.status(200).json({
            success: true,
            data: content
        })
    } catch (error) {
        console.error("Get Single User Content Error:", error.message)
        return res.status(500).json({
            success: false,
            error: error.message
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
        message.includes("Only PDF or image files are supported") ||
        message.includes("File is required") ||
        message.includes("Unsupported file type")
    ) {
        return 400
    }

    if (
        message.includes("IMAGEKIT_PRIVATE_KEY") ||
        message.includes("ImageKit public key") ||
        message.includes("Your account cannot be authenticated")
    ) {
        return 500
    }

    return 500
}

// Converts low-level upload errors into readable API messages for the frontend or API client.
// Input: thrown error from upload/extract/AI services.
// Output: safe response message string.
function resolveUploadErrorMessage(error) {
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

    return "Failed to upload content"
}
