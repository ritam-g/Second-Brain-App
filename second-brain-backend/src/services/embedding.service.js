import { MistralAIEmbeddings } from "@langchain/mistralai"

const maxQueryCharacters = 4000
const maxDocumentCharacters = 12000

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

// Generates a single embedding vector for one full content body so documents can be compared at the content level.
// Input: raw content text.
// Output: one embedding vector representing the whole content item.
export async function embedText(text) {
    const normalizedText = normalizeSingleText(text, "Content text is required for embedding")

    const client = getEmbeddingClient()
    const embeddings = await client.embedDocuments([normalizedText.slice(0, maxDocumentCharacters)])
    const vector = embeddings?.[0]

    if (!Array.isArray(vector) || !vector.length) {
        throw new Error("Embedding generation returned an empty content vector")
    }

    return vector
}

// Generates a single embedding vector for semantic search queries.
// Input: search query text.
// Output: one embedding vector ready to query Pinecone.
export async function embedQuery(query) {
    const normalizedQuery = normalizeSingleText(query, "Search query is required for semantic search")

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

// Normalizes one text input before it is sent to the embedding model.
// Input: raw text plus the empty-input error message.
// Output: compact, non-empty string.
function normalizeSingleText(text, emptyMessage) {
    const normalizedText = String(text || "")
        .replace(/\s+/g, " ")
        .trim()

    if (!normalizedText) {
        throw new Error(emptyMessage)
    }

    return normalizedText
}
