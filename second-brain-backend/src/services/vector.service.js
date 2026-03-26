import { Pinecone } from "@pinecone-database/pinecone"

const defaultIndexName = "second-brain"
const defaultTopK = 5
const maxTopK = 20
const maxMetadataTextCharacters = 1600

let pineconeClient = null
let pineconeIndex = null

// Stores document chunk vectors in Pinecone with stable ids and searchable metadata.
// Input: document embeddings, optional chunk list, and metadata containing userId/title/contentId.
// Output: ordered list of stored vector ids.
export async function storeVectorsInPinecone({ embeddings = [], chunks = [], metadata = {} }) {
    // Clean and validate every embedding before we build Pinecone records.
    const normalizedEmbeddings = normalizeEmbeddings(embeddings)

    if (!normalizedEmbeddings.length) {
        return []
    }

    if (Array.isArray(chunks) && chunks.length && chunks.length !== normalizedEmbeddings.length) {
        throw new Error("Chunk and embedding counts must match before storing vectors")
    }

    // Every record must carry Mongo mapping fields so search results can be hydrated later.
    const requiredMetadata = normalizeRequiredMetadata(metadata)

    // We use deterministic ids based on contentId + chunk index.
    // That makes deletes, retries, and future re-indexing predictable.
    const records = normalizedEmbeddings.map((values, chunkIndex) => ({
        id: buildVectorId(requiredMetadata.contentId, chunkIndex),
        values,
        metadata: {
            userId: requiredMetadata.userId,
            title: requiredMetadata.title,
            contentId: requiredMetadata.contentId,
            chunkIndex,
            type: requiredMetadata.type,
            url: requiredMetadata.url,
            image: requiredMetadata.image,
            text: normalizeChunkMetadataText(chunks[chunkIndex]),
        },
    }))

    // Upsert writes all chunk vectors in one request.
    const index = getPineconeIndex()
    await index.upsert({ records })

    return records.map(record => record.id)
}

// Queries Pinecone using a semantic query vector and user-level metadata filtering.
// Input: one embedding vector, authenticated user id, and optional topK.
// Output: Pinecone match list with ids, scores, and metadata.
export async function searchVectorsInPinecone({ vector, userId, topK = defaultTopK }) {
    // Normalize the query vector so Pinecone receives only numeric values.
    const normalizedVector = normalizeVector(vector)

    if (!normalizedVector.length) {
        throw new Error("A query vector is required for Pinecone search")
    }

    const filterUserId = String(userId || "").trim()

    // User-level metadata filtering ensures each user only sees their own vectors.
    const index = getPineconeIndex()
    const response = await index.query({
        vector: normalizedVector,
        topK: normalizeTopK(topK),
        includeMetadata: true,
        filter: filterUserId
            ? {
                userId: { $eq: filterUserId },
            }
            : undefined,
    })

    return Array.isArray(response?.matches) ? response.matches : []
}

// Deletes vectors by id so failed uploads and content removals do not leave stale records behind.
// Input: vector id array.
// Output: promise that resolves when the delete completes.
export async function deleteVectorsFromPinecone(vectorIds = []) {
    const ids = [...new Set(
        (Array.isArray(vectorIds) ? vectorIds : [])
            .map(id => String(id || "").trim())
            .filter(Boolean),
    )]

    if (!ids.length) {
        return
    }

    const index = getPineconeIndex()
    await index.deleteMany({ ids })
}

// Rebuilds the deterministic vector ids used for a content document's chunk set.
// Input: Mongo content id and chunk count.
// Output: ordered vector id list.
export function buildVectorIds(contentId, chunkCount) {
    const totalChunks = Number(chunkCount)

    if (!Number.isInteger(totalChunks) || totalChunks <= 0) {
        return []
    }

    return Array.from({ length: totalChunks }, (_, index) => buildVectorId(contentId, index))
}

// Produces a stable vector id so chunks can be re-derived later for deletes or migrations.
// Input: Mongo content id and chunk index.
// Output: stable Pinecone vector id.
export function buildVectorId(contentId, chunkIndex) {
    return `${String(contentId || "").trim()}-chunk-${chunkIndex}`
}

// Lazily creates a Pinecone index client.
// Input: none.
// Output: configured Pinecone index instance.
function getPineconeIndex() {
    if (pineconeIndex) {
        return pineconeIndex
    }

    const apiKey = String(process.env.PINECONE_API_KEY || "").trim()

    if (!apiKey) {
        throw new Error("PINECONE_API_KEY is not configured")
    }

    pineconeClient = pineconeClient || new Pinecone({ apiKey })

    const indexHost = String(process.env.PINECONE_INDEX_HOST || "").trim()
    const indexName = String(
        process.env.PINECONE_INDEX_NAME
        || process.env.PINECONE_INDEX
        || defaultIndexName,
    ).trim()
    const namespace = String(process.env.PINECONE_NAMESPACE || "").trim()

    if (!indexHost && !indexName) {
        throw new Error("PINECONE_INDEX_HOST or PINECONE_INDEX_NAME is required")
    }

    // Prefer host-based targeting in production because it avoids an extra lookup.
    pineconeIndex = indexHost
        ? pineconeClient.index({ host: indexHost })
        : pineconeClient.index({ name: indexName })

    if (namespace) {
        pineconeIndex = pineconeIndex.namespace(namespace)
    }

    return pineconeIndex
}

// Ensures every stored vector has the metadata required to map Pinecone hits back to MongoDB.
// Input: raw metadata object.
// Output: normalized metadata with required fields.
function normalizeRequiredMetadata(metadata) {
    const userId = String(metadata?.userId || "").trim()
    const title = String(metadata?.title || "").trim()
    const contentId = String(metadata?.contentId || "").trim()

    // These three values are the minimum required for Mongo <-> Pinecone mapping.
    if (!userId || !title || !contentId) {
        throw new Error("Pinecone vector metadata must include userId, title, and contentId")
    }

    return {
        userId,
        title: title.slice(0, 200),
        contentId,
        type: String(metadata?.type || "document").trim() || "document",
        url: normalizeMetadataString(metadata?.url, 600),
        image: normalizeMetadataString(metadata?.image, 600),
    }
}

// Normalizes a list of embedding vectors before storage.
// Input: raw embedding array.
// Output: validated numeric vectors.
function normalizeEmbeddings(embeddings) {
    if (!Array.isArray(embeddings)) {
        throw new Error("Embeddings must be provided as an array")
    }

    return embeddings.map(normalizeVector).filter(vector => vector.length > 0)
}

// Normalizes a single vector before it is sent to Pinecone.
// Input: raw vector value.
// Output: numeric vector array.
function normalizeVector(vector) {
    if (!Array.isArray(vector)) {
        throw new Error("Embedding vector must be an array")
    }

    const numericValues = vector.map(value => Number(value))

    if (!numericValues.length || numericValues.some(value => !Number.isFinite(value))) {
        throw new Error("Embedding vector contains invalid numeric values")
    }

    return numericValues
}

// Constrains Pinecone search fan-out to a reasonable production-safe range.
// Input: user-provided topK value.
// Output: bounded topK integer.
function normalizeTopK(topK) {
    const numericTopK = Number(topK)

    if (!Number.isFinite(numericTopK) || numericTopK <= 0) {
        return defaultTopK
    }

    return Math.min(maxTopK, Math.max(1, Math.round(numericTopK)))
}

// Clips chunk text before it is stored as Pinecone metadata so retrieval stays useful without bloating record size.
// Input: raw chunk string.
// Output: compact metadata-safe chunk text.
function normalizeChunkMetadataText(chunk) {
    return String(chunk || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxMetadataTextCharacters)
}

// Normalizes optional metadata string fields before they are attached to a Pinecone record.
// Input: raw metadata value and max length.
// Output: clipped string value.
function normalizeMetadataString(value, maxLength) {
    return String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLength)
}
