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

    // this is for fornt below i am writing reson
    // acutlly weat we ned we are making proper id for every only for the special rote actully this data is all in the content model
    // here we are making the id for the all content
    // reason thik like tree evry tree has own id and his children so childdren will edges 
    const nodes = contents.map(content => ({
        id: String(content?._id || ""),   //id for the all content 
        title: normalizeGraphValue(content?.title, 200) || "Untitled Content",//displaying the title
        image: normalizeGraphValue(content?.image, 600),//displaying the image
        type: normalizeGraphValue(content?.type, 40) || "article",// displaying the type
    }))
    const edges = []
    const comparableBuckets = bucketContentsByEmbeddingSize(contents)
    // WHY we send BOTH nodes and edges:

    // Nodes:
    // Nodes are used for visualization (UI).
    // Each node represents one content item and contains:
    // - id → unique identifier
    // - title → what to display
    // - image → thumbnail
    // - type → category (pdf, article, image, etc.)

    // So basically, nodes = "what to show on screen"


    // Edges:
    // Edges represent relationships between nodes.
    // Each edge connects two nodes using:
    // - source → from which node
    // - target → to which node
    // - weight → how strongly they are related

    // So edges = "how nodes are connected"


    // Example understanding (like a tree or graph):
    // Imagine each content item is a node.
    // If two contents are similar, we connect them with an edge.

    // Example:
    // Node A → Node B → Node C
    // This means A is related to B, and B is related to C.


    // WHY both are needed:
    // - Nodes show the actual data (title, image, etc.)
    // - Edges show the relationship between them

    // Without nodes → nothing to display
    // Without edges → no connections (no graph)


    // HOW edges are created:
    // We compare every content with others (pairwise comparison)

    // Example:
    // Content 1 compared with Content 2
    // Content 1 compared with Content 3
    // Content 2 compared with Content 3

    // This is why complexity is O(n²) (each item with every other item)


    // WHEN we create an edge:
    // Only when similarity > 0.75

    // Meaning:
    // We only connect content that is strongly related
    // Weak relationships are ignored to keep graph clean


    // IMPORTANT:
    // We are NOT modifying content data
    // We are only sending relationships (edges)

    // So:
    // - Nodes = existing data
    // - Edges = derived relationships


    // FINAL IDEA:
    // Instead of showing all items randomly,
    // we organize them into a graph structure
    // where related items are connected together

    // This helps:
    // - visualize knowledge
    // - find related content easily
    // - understand connections between ideas
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
