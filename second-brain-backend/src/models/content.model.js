// ### 👉 Fields:

import mongoose from "mongoose";

// * userId
// * title
// * url
// * type
// * tags (array)

const contentSchema = new mongoose.Schema({
    userId: { type: String },
    title: { type: String, required: true },
    url: { type: String, required: true },
    tags: { type: [String] },
}
,{
    timestamps: true

});

const contentModel = mongoose.model("Content", contentSchema);

export default contentModel