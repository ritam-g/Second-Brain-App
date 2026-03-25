// ### 👉 Fields:

import mongoose from "mongoose";

// * userId
// * title
// * url
// * type
// * tags (array)

const contentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    tags: { type: [String], required: true },
    type: { type: String,
        enum: ["article", "youtube", "tweet", "pdf","linkedin","instagram","github","x"],
        default: "article"
    },
    description: { type: String },
    image: { type: String },
}
    , {
        timestamps: true

    });

const contentModel = mongoose.model("Content", contentSchema);

export default contentModel