import mongoose from "mongoose"

// Defines how saved content is stored for links, uploaded documents, and uploaded images.
// Input: mongoose field definitions for each saved content attribute.
// Output: MongoDB schema used to create the Content model.
const contentSchema = new mongoose.Schema({
    // Owner of the saved item.
    userId: { type: String, required: true, index: true },

    // Core card fields shown in the product UI.
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },

    tags: { type: [String], required: true, default: [] },

    // Hierarchical AI classification used for smarter filtering and future graph/grouping workflows.
    category: { type: String, default: "" },
    subCategory: { type: String, default: "" },

    type: {
        type: String,
        enum: ["article", "youtube", "tweet", "pdf", "document", "image", "linkedin", "instagram", "github", "x"],
        default: "article",
    },

    description: { type: String, default: "" },
    image: { type: String, default: "" },

    // Short AI-friendly summary used for cards and future retrieval flows.
    summary: { type: String, default: "" },

    // Marks whether this document has searchable vectors in Pinecone.
    vectorReady: { type: Boolean, default: false, index: true },

    // Stable application-level id used to map Mongo documents to Pinecone metadata.
    contentId: { type: String, index: true },

    // Stores every Pinecone vector id created for this content's chunks.
    vectorIds: { type: [String], default: [] },

    // Raw chunk text kept in Mongo for debugging, RAG, and future chat workflows.
    textChunks: { type: [String], default: [] },

    // Stores one content-level embedding for relationship graph building.
    embedding: { type: [Number], default: [], select: false },
}, {
    timestamps: true,
})

// Fast dashboard listing for one user.
contentSchema.index({ userId: 1, createdAt: -1 })

// Fast lookup when hydrating Pinecone search hits back into Mongo documents.
contentSchema.index({ userId: 1, contentId: 1 })

const contentModel = mongoose.model("Content", contentSchema)

export default contentModel
