import { generateGroundedAnswer } from "../services/ai.service.js"
import { normalizeRetrievalTopK, retrieveRelevantChunks } from "../services/retrieval.service.js"

const defaultTopK = 6

// Runs the full RAG flow: retrieve top chunks, ask Mistral to answer from that context, and return sources.
// Input: request body with `query` and optional `topK`, plus authenticated `req.user.id`.
// Output: grounded answer string plus the chunk-level sources used to answer it.
export async function ragQueryController(req, res) {
    try {
        const query = String(req.body?.query || "").trim()

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Query is required",
            })
        }

        const sources = await retrieveRelevantChunks({
            query,
            userId: String(req.user.id),
            topK: normalizeRetrievalTopK(req.body?.topK ?? defaultTopK),
        })
        const answer = sources.length
            ? await generateGroundedAnswer({ query, sources })
            : `I could not find enough grounded context in your knowledge base to answer "${query}" yet. Try broader wording or upload the relevant document first.`

        return res.status(200).json({
            success: true,
            data: {
                query,
                answer,
                sources: sources.map(source => ({
                    id: source.id,
                    score: source.score,
                    title: source.metadata?.title || "Untitled Content",
                    type: source.metadata?.type || "article",
                    text: source.metadata?.text || "",
                    image: source.metadata?.image || "",
                    url: source.metadata?.url || "",
                    contentId: source.metadata?.contentId || "",
                    createdAt: source.metadata?.createdAt || "",
                })),
            },
        })
    } catch (error) {
        console.error("RAG Query Error:", error.message)

        return res.status(500).json({
            success: false,
            message: resolveRagErrorMessage(error),
        })
    }
}

// Backward-compatible alias in case another module imports the shorter controller name.
export const ragQuery = ragQueryController

// Converts low-level retrieval and AI failures into a readable API message.
// Input: thrown RAG error.
// Output: safe response message string.
function resolveRagErrorMessage(error) {
    const message = String(error?.message || "")

    if (message.includes("MISTRAL_API_KEY")) {
        return "Mistral API key is missing or invalid."
    }

    if (message.includes("PINECONE_")) {
        return "Pinecone is not configured correctly for retrieval."
    }

    return "Failed to answer the question from your knowledge base"
}
