import ImageKit, { toFile } from "@imagekit/nodejs"

let imageKitClient = null

// Uploads the original file buffer to ImageKit so the saved content has a durable URL.
// Input: multer file object plus optional upload context such as `userId` and `uploadType`.
// Output: ImageKit upload response containing public URLs and asset metadata.
export async function uploadFileToImageKit(file, options = {}) {
    const client = getImageKitClient()
    const safeFileName = sanitizeFileName(file?.originalname || "upload-file")
    const uploadFolder = buildUploadFolder(options?.userId)
    const uploadableFile = await toFile(file.buffer, safeFileName, {
        type: file.mimetype,
    })

    return client.files.upload({
        file: uploadableFile,
        fileName: safeFileName,
        folder: uploadFolder,
        useUniqueFileName: true,
        tags: buildUploadTags(options?.uploadType, options?.userId),
    })
}

// Deletes an uploaded ImageKit asset so failed pipelines do not leave orphan files behind.
// Input: ImageKit file id string from a successful upload response.
// Output: promise that resolves when the remote asset is removed.
export async function deleteFileFromImageKit(fileId) {
    const normalizedFileId = String(fileId || "").trim()

    if (!normalizedFileId) {
        return
    }

    const client = getImageKitClient()
    await client.files.delete(normalizedFileId)
}

// Lazily creates the ImageKit client so the backend only requires upload credentials when this feature is used.
// Input: none.
// Output: configured ImageKit client instance.
function getImageKitClient() {
    if (imageKitClient) {
        return imageKitClient
    }

    const privateKey = String(process.env.IMAGEKIT_PRIVATE_KEY || "").trim()

    if (!privateKey) {
        throw new Error("IMAGEKIT_PRIVATE_KEY is not configured")
    }

    validateImageKitPrivateKey(privateKey)

    imageKitClient = new ImageKit({
        privateKey,
    })

    return imageKitClient
}

// Builds a user-scoped upload folder so uploaded assets stay organized in ImageKit.
// Input: authenticated user id.
// Output: folder path string for the ImageKit upload request.
function buildUploadFolder(userId) {
    const baseFolder = String(process.env.IMAGEKIT_UPLOAD_FOLDER || "/second-brain/uploads")
        .trim()
        .replace(/\/+$/, "")

    return `${baseFolder}/${sanitizeFolderSegment(userId || "anonymous")}`
}

// Builds searchable ImageKit tags for uploaded assets.
// Input: upload type string and authenticated user id.
// Output: deduplicated array of upload tags.
function buildUploadTags(uploadType, userId) {
    const tags = [
        "second-brain",
        "upload",
        String(uploadType || "").trim().toLowerCase(),
        userId ? `user-${sanitizeFolderSegment(userId)}` : "",
    ]

    return [...new Set(tags.filter(Boolean))]
}

// Converts the uploaded filename into an ImageKit-safe public name.
// Input: original uploaded filename.
// Output: sanitized filename string that keeps a stable extension when available.
function sanitizeFileName(fileName) {
    const trimmedFileName = String(fileName || "").trim()
    const hasExtension = trimmedFileName.includes(".")
    const extension = hasExtension ? trimmedFileName.split(".").pop() : ""
    const baseName = hasExtension
        ? trimmedFileName.slice(0, trimmedFileName.length - extension.length - 1)
        : trimmedFileName

    const cleanBaseName = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

    const safeBaseName = cleanBaseName || "upload-file"
    const safeExtension = String(extension || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")

    return safeExtension ? `${safeBaseName}.${safeExtension}` : safeBaseName
}

// Sanitizes dynamic folder segments before they are used in ImageKit paths.
// Input: raw user or context value.
// Output: lowercase path-safe segment string.
function sanitizeFolderSegment(value) {
    const normalizedValue = String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, "-")
        .replace(/^-+|-+$/g, "")

    return normalizedValue || "default"
}

// Validates that the configured ImageKit secret is actually a private server-side key.
// Input: raw ImageKit key from environment variables.
// Output: throws a readable configuration error when the key format is invalid.
function validateImageKitPrivateKey(privateKey) {
    const normalizedKey = String(privateKey || "").trim()

    if (normalizedKey.startsWith("public_")) {
        throw new Error("IMAGEKIT_PRIVATE_KEY is using an ImageKit public key. Use your ImageKit private key in the backend .env file.")
    }

    if (/^https?:\/\//i.test(normalizedKey)) {
        throw new Error("IMAGEKIT_PRIVATE_KEY is using a URL. Use your ImageKit private key in the backend .env file.")
    }
}
