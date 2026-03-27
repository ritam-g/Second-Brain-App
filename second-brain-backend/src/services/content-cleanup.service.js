import contentModel from "../models/content.model.js"
import { deleteFileFromImageKit } from "./upload.service.js"
import { buildVectorIds, deleteVectorsFromPinecone } from "./vector.service.js"

// Cleans up one content document's external artifacts such as Pinecone vectors and uploaded files.
// Input: content document or plain object.
// Output: promise that resolves after best-effort cleanup completes.
export async function cleanupContentArtifacts(content) {
    const normalizedContent = typeof content?.toObject === "function"
        ? content.toObject()
        : { ...(content || {}) }

    const vectorIds = resolveContentVectorIds(normalizedContent)
    const fileStorageId = String(normalizedContent?.fileStorageId || "").trim()

    if (vectorIds.length) {
        try {
            await deleteVectorsFromPinecone(vectorIds)
        } catch (cleanupError) {
            console.error("Content Vector Cleanup Error:", cleanupError.message)
        }
    }

    if (fileStorageId) {
        try {
            await deleteFileFromImageKit(fileStorageId)
        } catch (cleanupError) {
            console.error("Content File Cleanup Error:", cleanupError.message)
        }
    }
}

// Removes all content owned by one user and cleans their vector/file side effects.
// Input: authenticated user id string.
// Output: summary object with deleted content count.
export async function clearUserContentByUserId(userId) {
    const normalizedUserId = String(userId || "").trim()

    if (!normalizedUserId) {
        return { deletedCount: 0 }
    }

    const contents = await contentModel
        .find({ userId: normalizedUserId })
        .select("_id contentId textChunks vectorIds fileStorageId")

    await Promise.allSettled(contents.map((content) => cleanupContentArtifacts(content)))

    const deleteResult = await contentModel.deleteMany({ userId: normalizedUserId })

    return {
        deletedCount: Number(deleteResult?.deletedCount) || 0,
    }
}

function resolveContentVectorIds(content) {
    const storedVectorIds = Array.isArray(content?.vectorIds)
        ? content.vectorIds.map((id) => String(id || "").trim()).filter(Boolean)
        : []

    if (storedVectorIds.length) {
        return [...new Set(storedVectorIds)]
    }

    return content?.contentId
        ? buildVectorIds(content.contentId, content.textChunks?.length)
        : []
}
