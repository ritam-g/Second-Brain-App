import mongoose from "mongoose"

// Defines how saved content is stored for links, uploaded documents, and uploaded images.
// Input: mongoose field definitions for each saved content attribute.
// Output: MongoDB schema used to create the Content model.
const contentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    tags: { type: [String], required: true },
    type: {
        type: String,
        enum: ["article", "youtube", "tweet", "pdf", "document", "image", "linkedin", "instagram", "github", "x"],
        default: "article"
    },
    description: { type: String },
    image: { type: String },
}, {
    timestamps: true
})

const contentModel = mongoose.model("Content", contentSchema)

export default contentModel
