import { normalizeRetrievalTopK, retrieveRelevantChunks } from "../services/retrieval.service.js"

// Converts a semantic query into Pinecone chunk matches and returns chunk-level metadata.
// Input: request body with `query` and optional `topK`, plus authenticated `req.user.id`.
// Output: ordered semantic chunk matches with metadata ready for the frontend search UI.
export async function semanticSearchController(req, res) {
    try {
        const query = String(req.body?.query || "").trim()

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Search query is required",
            })
        }

        const matches = await retrieveRelevantChunks({
            query,
            userId: String(req.user.id),
            topK: normalizeRetrievalTopK(req.body?.topK),
        })
        if (!matches) {
            return res.status(404).json({
                success: false,
                message: "No matches found",
            })
        }
        
        return res.status(200).json({
            success: true,
            data: matches,
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
