import { MistralAIEmbeddings } from "@langchain/mistralai"

const maxQueryCharacters = 4000

let embeddingClient = null

// Generates embeddings for document chunks that will be indexed in Pinecone.
// Input: array of chunk strings.
// Output: array of embedding vectors in the same order as the input chunks.
export async function generateEmbeddings(chunks = []) {
    const normalizedChunks = normalizeChunks(chunks)

    if (!normalizedChunks.length) {
        return []
    }

    const client = getEmbeddingClient()
    const embeddings = await client.embedDocuments(normalizedChunks)

    if (embeddings.length !== normalizedChunks.length) {
        throw new Error("Embedding generation returned an unexpected number of vectors")
    }

    return embeddings
}

// Generates a single embedding vector for semantic search queries.
// Input: search query text.
// Output: one embedding vector ready to query Pinecone.
export async function embedQuery(query) {
    const normalizedQuery = String(query || "").trim()

    if (!normalizedQuery) {
        throw new Error("Search query is required for semantic search")
    }

    const client = getEmbeddingClient()
    const vector = await client.embedQuery(normalizedQuery.slice(0, maxQueryCharacters))

    if (!Array.isArray(vector) || !vector.length) {
        throw new Error("Embedding generation returned an empty query vector")
    }

    return vector
}

// Lazily creates the embedding client so unrelated routes do not fail during boot.
// Input: none.
// Output: configured Mistral embeddings client.
function getEmbeddingClient() {
    if (embeddingClient) {
        return embeddingClient
    }

    const apiKey = String(process.env.MISTRAL_API_KEY || "").trim()

    if (!apiKey) {
        throw new Error("MISTRAL_API_KEY is not configured")
    }

    embeddingClient = new MistralAIEmbeddings({
        apiKey,
        model: process.env.MISTRAL_EMBEDDING_MODEL || "mistral-embed",
        batchSize: Number(process.env.EMBEDDING_BATCH_SIZE || 128),
        stripNewLines: true,
        maxConcurrency: 2,
    })

    return embeddingClient
}

// Normalizes chunk input before it is sent to the embedding model.
// Input: raw chunk array.
// Output: cleaned, non-empty chunk array.
function normalizeChunks(chunks) {
    if (!Array.isArray(chunks)) {
        throw new Error("Document chunks must be provided as an array")
    }

    return chunks
        .map(chunk => String(chunk || "").replace(/\s+/g, " ").trim())
        .filter(Boolean)
}
