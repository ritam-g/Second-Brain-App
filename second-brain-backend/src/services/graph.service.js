import contentModel from "../models/content.model.js"

const similarityThreshold = 0.75
const maxEdgeWeightDecimals = 4

// Measures how similar two numeric vectors are for content-relationship scoring.
// Input: two embedding arrays with the same dimensions.
// Output: cosine similarity score when both vectors are usable.
export function cosineSimilarity(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || !a.length || a.length !== b.length) {
        return 0
    }

    let dot = 0
    let normA = 0
    let normB = 0

    for (let index = 0; index < a.length; index += 1) {
        dot += a[index] * b[index]
        normA += a[index] * a[index]
        normB += b[index] * b[index]
    }

    if (!normA || !normB) {
        return 0
    }

    const similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB))

    return Number.isFinite(similarity) ? similarity : 0
}

// Builds a lightweight knowledge graph by connecting the current user's similar content items.
// Input: authenticated user id.
// Output: graph object containing content nodes and similarity edges.
export async function buildKnowledgeGraph(userId) {
    const normalizedUserId = String(userId || "").trim()

    if (!normalizedUserId) {
        throw new Error("User id is required to build the knowledge graph")
    }

    const contents = await contentModel.find({ userId: normalizedUserId })
        .select("title image type +embedding")
        .lean()
    const nodes = contents.map(content => ({
        id: String(content?._id || ""),
        title: normalizeGraphValue(content?.title, 200) || "Untitled Content",
        image: normalizeGraphValue(content?.image, 600),
        type: normalizeGraphValue(content?.type, 40) || "article",
    }))
    const edges = []
    const comparableBuckets = bucketContentsByEmbeddingSize(contents)

    comparableBuckets.forEach(bucket => {
        for (let sourceIndex = 0; sourceIndex < bucket.length; sourceIndex += 1) {
            const source = bucket[sourceIndex]

            for (let targetIndex = sourceIndex + 1; targetIndex < bucket.length; targetIndex += 1) {
                const target = bucket[targetIndex]
                const similarity = cosineSimilarity(source.embedding, target.embedding)

                if (similarity > similarityThreshold) {
                    edges.push({
                        source: source.id,
                        target: target.id,
                        weight: Number(similarity.toFixed(maxEdgeWeightDecimals)),
                    })
                }
            }
        }
    })

    return { nodes, edges }
}

// Groups content items by embedding size so we only compare vectors that can be scored against each other.
// Input: raw content document list from Mongo.
// Output: arrays of comparable content items keyed by embedding length.
function bucketContentsByEmbeddingSize(contents) {
    const buckets = new Map()

    contents.forEach(content => {
        const embedding = normalizeEmbedding(content?.embedding)

        if (!embedding.length) {
            return
        }

        const dimension = embedding.length
        const bucket = buckets.get(dimension) || []

        bucket.push({
            id: String(content?._id || ""),
            embedding,
        })
        buckets.set(dimension, bucket)
    })

    return [...buckets.values()]
}

// Ensures only valid numeric embeddings are used in graph similarity comparisons.
// Input: raw embedding value from Mongo.
// Output: numeric embedding array or an empty array when unusable.
function normalizeEmbedding(embedding) {
    if (!Array.isArray(embedding) || !embedding.length) {
        return []
    }

    const numericEmbedding = embedding.map(value => Number(value))

    return numericEmbedding.every(value => Number.isFinite(value)) ? numericEmbedding : []
}

// Normalizes node display values before they are returned by the graph API.
// Input: raw value and max length.
// Output: compact string safe for the frontend.
function normalizeGraphValue(value, maxLength) {
    return String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLength)
}
