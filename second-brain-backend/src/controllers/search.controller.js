import contentModel from "../models/content.model.js"
import { embedQuery } from "../services/embedding.service.js"
import { searchVectorsInPinecone } from "../services/vector.service.js"

const defaultTopK = 5
const maxTopK = 10
const searchFanoutMultiplier = 3

// Converts a semantic query into an embedding, searches Pinecone, and hydrates the hits from MongoDB.
// Input: request body with `query` and optional `topK`, plus authenticated `req.user.id`.
// Output: enriched search matches containing Mongo content fields and Pinecone scores.
export async function semanticSearchController(req, res) {
    try {
        // Read and validate the natural-language query from the client.
        const query = String(req.body?.query || "").trim()

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Search query is required",
            })
        }

        const userId = String(req.user.id)
        const topK = normalizeTopK(req.body?.topK)

        // Convert the user's question into an embedding vector.
        const queryVector = await embedQuery(query)

        // Ask Pinecone for more matches than we finally return.
        // This helps because multiple chunk hits can belong to the same document.
        const pineconeMatches = await searchVectorsInPinecone({
            vector: queryVector,
            userId,
            topK: topK * searchFanoutMultiplier,
        })

        // Replace raw vector hits with real Mongo content cards.
        const enrichedMatches = await hydrateMongoMatches({
            matches: pineconeMatches,
            userId,
            limit: topK,
        })

        return res.status(200).json({
            success: true,
            data: enrichedMatches,
        })
    } catch (error) {
        console.error("Semantic Search Error:", error.message)

        return res.status(500).json({
            success: false,
            message: resolveSearchErrorMessage(error),
        })
    }
}

// Backward-compatible export for any existing imports using the old controller name.
export const semanticSearch = semanticSearchController

// Fetches Mongo content docs for Pinecone hits and preserves the match ordering.
// Input: Pinecone match list, authenticated user id, and final result limit.
// Output: deduplicated, enriched response objects.
async function hydrateMongoMatches({ matches, userId, limit }) {
    if (!Array.isArray(matches) || !matches.length) {
        return []
    }

    const vectorIds = matches
        .map(match => String(match?.id || "").trim())
        .filter(Boolean)
    const contentIdsFromMetadata = matches
        .map(match => String(match?.metadata?.contentId || "").trim())
        .filter(Boolean)

    if (!vectorIds.length && !contentIdsFromMetadata.length) {
        return []
    }

    // Pull matching documents in one Mongo query instead of querying per match.
    const contentDocuments = await contentModel.find({
        userId,
        vectorReady: true,
        $or: [
            { contentId: { $in: contentIdsFromMetadata } },
            { vectorIds: { $in: vectorIds } },
            { contentId: { $in: vectorIds } },
        ],
    }).lean()
    const documentsByContentId = new Map()
    const documentsByVectorId = new Map()

    contentDocuments.forEach(document => {
        const normalizedContentId = String(document.contentId || document._id || "").trim()

        if (normalizedContentId) {
            documentsByContentId.set(normalizedContentId, document)
        }

        const storedVectorIds = Array.isArray(document.vectorIds) ? document.vectorIds : []

        storedVectorIds.forEach(vectorId => {
            const normalizedVectorId = String(vectorId || "").trim()

            if (normalizedVectorId) {
                documentsByVectorId.set(normalizedVectorId, document)
            }
        })
    })

    const enrichedMatches = []
    const seenContentIds = new Set()

    for (const match of matches) {
        const vectorId = String(match?.id || "").trim()
        const metadataContentId = String(match?.metadata?.contentId || "").trim()

        // Prefer contentId from Pinecone metadata, then fall back to stored vector ids.
        const document = documentsByContentId.get(metadataContentId)
            || documentsByVectorId.get(vectorId)
            || documentsByContentId.get(vectorId)

        if (!document) {
            continue
        }

        const resolvedContentId = String(document.contentId || document._id || "").trim()

        if (!resolvedContentId || seenContentIds.has(resolvedContentId)) {
            continue
        }

        // Avoid returning the same content multiple times when many chunks match the same document.
        seenContentIds.add(resolvedContentId)
        enrichedMatches.push({
            contentId: resolvedContentId,
            title: document.title,
            image: document.image || "",
            tags: Array.isArray(document.tags) ? document.tags : [],
            description: document.description || document.summary || "",
            score: Number.isFinite(match?.score) ? match.score : null,
            vectorId,
        })

        if (enrichedMatches.length >= limit) {
            break
        }
    }

    return enrichedMatches
}

// Constrains requested topK values to keep query cost and payload size predictable.
// Input: raw topK value from the request body.
// Output: bounded integer topK.
function normalizeTopK(topK) {
    const numericTopK = Number(topK)

    if (!Number.isFinite(numericTopK) || numericTopK <= 0) {
        return defaultTopK
    }

    return Math.min(maxTopK, Math.max(1, Math.round(numericTopK)))
}

// Converts low-level vector/embedding failures into safer API messages.
// Input: thrown search error.
// Output: response message string.
function resolveSearchErrorMessage(error) {
    const message = String(error?.message || "")

    if (message.includes("MISTRAL_API_KEY")) {
        return "Mistral API key is missing or invalid."
    }

    if (message.includes("PINECONE_")) {
        return "Pinecone is not configured correctly for semantic search."
    }

    return "Failed to perform semantic search"
}
