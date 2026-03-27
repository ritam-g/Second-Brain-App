import contentModel from "../models/content.model.js"
import { embedQuery } from "./embedding.service.js"
import { searchVectorsInPinecone } from "./vector.service.js"

const defaultTopK = 5
const maxTopK = 12
const maxChunkCharacters = 1600

// Runs the full retrieval step for semantic search or RAG: embed query, search Pinecone, and enrich matches.
// Input: natural-language query, authenticated user id, and optional topK.
// Output: ordered list of chunk matches with normalized metadata ready for the API layer.
export async function retrieveRelevantChunks({ query, userId, topK = defaultTopK }) {
    const normalizedQuery = String(query || "").trim()
    const normalizedUserId = String(userId || "").trim()

    if (!normalizedQuery) {
        throw new Error("Search query is required")
    }

    const queryVector = await embedQuery(normalizedQuery)
    const matches = await searchVectorsInPinecone({
        vector: queryVector,
        userId: normalizedUserId,
        topK: normalizeRetrievalTopK(topK),
    })

    return enrichRetrievedMatches({
        matches,
        userId: normalizedUserId,
    })
}

// Constrains retrieval fan-out so Pinecone cost and response sizes stay bounded.
// Input: requested topK value.
// Output: bounded integer.
export function normalizeRetrievalTopK(topK) {
    const numericTopK = Number(topK)

    if (!Number.isFinite(numericTopK) || numericTopK <= 0) {
        return defaultTopK
    }

    return Math.min(maxTopK, Math.max(1, Math.round(numericTopK)))
}

// Adds Mongo-backed fields to Pinecone matches so APIs can return consistent chunk metadata.
// Input: raw Pinecone match list and authenticated user id.
// Output: normalized match list containing metadata, score, tags, and description.
async function enrichRetrievedMatches({ matches, userId }) {
    if (!Array.isArray(matches) || !matches.length) {
        return []
    }

    const contentIds = [...new Set(
        matches
            .map(match => String(match?.metadata?.contentId || "").trim())
            .filter(Boolean),
    )]
    const contentDocuments = contentIds.length
        ? await contentModel.find({
            userId,
            $or: [
                { _id: { $in: contentIds } },
                { contentId: { $in: contentIds } },
            ],
        }).lean()
        : []
    const documentsByContentId = new Map()

    contentDocuments.forEach(document => {
        const normalizedContentId = String(document?.contentId || document?._id || "").trim()

        if (!normalizedContentId) {
            return
        }

        documentsByContentId.set(normalizedContentId, document)
        documentsByContentId.set(String(document?._id || "").trim(), document)
    })

    return matches
        .map(match => normalizeRetrievedMatch(match, documentsByContentId))
        .filter(Boolean)
}

// Converts one Pinecone hit into a frontend-friendly chunk result.
// Input: raw Pinecone match plus a lookup map of Mongo content docs.
// Output: normalized match object or null when the hit is unusable.
function normalizeRetrievedMatch(match, documentsByContentId) {
    const vectorId = String(match?.id || "").trim()
    const metadataContentId = String(match?.metadata?.contentId || "").trim()
    const contentDocument = documentsByContentId.get(metadataContentId)
    const chunkIndex = Number(match?.metadata?.chunkIndex)
    const metadataText = normalizeChunkText(match?.metadata?.text)
    const fallbackText = Number.isInteger(chunkIndex)
        ? normalizeChunkText(contentDocument?.textChunks?.[chunkIndex])
        : ""
    const contentId = metadataContentId || String(contentDocument?.contentId || contentDocument?._id || "").trim()
    const title = normalizeDisplayValue(match?.metadata?.title || contentDocument?.title || "Untitled Content", 200)
    const type = normalizeDisplayValue(match?.metadata?.type || contentDocument?.type || "article", 40).toLowerCase()
    const image = normalizeDisplayValue(match?.metadata?.image || contentDocument?.image, 600)
    const url = normalizeDisplayValue(match?.metadata?.url || contentDocument?.url, 600)
    const createdAt = normalizeDateValue(match?.metadata?.createdAt || contentDocument?.createdAt)
    const text = metadataText || fallbackText

    if (!vectorId || !contentId || !title || !text) {
        return null
    }

    return {
        id: vectorId,
        score: Number.isFinite(match?.score) ? match.score : null,
        description: normalizeDisplayValue(contentDocument?.description || contentDocument?.summary, 300),
        descriptionLanguage: normalizeDisplayValue(contentDocument?.descriptionLanguage, 12),
        tags: Array.isArray(contentDocument?.tags) ? contentDocument.tags : [],
        createdAt,
        metadata: {
            contentId,
            text,
            title,
            descriptionLanguage: normalizeDisplayValue(contentDocument?.descriptionLanguage, 12),
            type,
            image,
            url,
            createdAt,
            chunkIndex: Number.isInteger(chunkIndex) ? chunkIndex : null,
        },
    }
}

// Normalizes display metadata fields before they are returned through the API.
// Input: raw metadata string and max output length.
// Output: compact string value.
function normalizeDisplayValue(value, maxLength) {
    return String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLength)
}

// Keeps chunk text compact while preserving enough context for result cards and RAG prompts.
// Input: raw chunk text.
// Output: clipped chunk text string.
function normalizeChunkText(value) {
    return normalizeDisplayValue(value, maxChunkCharacters)
}

// Converts Mongo/Pinecone timestamps into stable ISO strings for frontend cards.
// Input: raw date-like value.
// Output: ISO timestamp string or empty string.
function normalizeDateValue(value) {
    const parsedDate = value instanceof Date ? value : new Date(value)

    if (Number.isNaN(parsedDate.getTime())) {
        return ""
    }

    return parsedDate.toISOString()
}
