import contentModel from "../models/content.model.js"
import { getMetadata } from "../services/metadata.service.js"
// Consolidated documentation in routes file
/** 
 * Controller to save new content (URL/Metadata)
 */
export async function saveContentController(req, res) {
    try {
        const { url, title } = req.body;

        // ✅ 1. Validate input
        if (!url) {
            return res.status(400).json({ message: "URL is required" });
        }

        // ✅ 2. Fetch metadata
        const meta = await getMetadata(url);

        // ✅ 3. Create content
        const content = await contentModel.create({
            url,
            title: title || meta.title || "No title",
            description: meta.description || "",
            image: meta.image || "",
            type: meta.type || "article",
            tags: meta.tags || [],
            userId: req.user.id,
        });

        // ✅ 4. Send response
        return res.status(201).json({
            success: true,
            data: content,
        });

    } catch (error) {
        console.error("Save Content Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to save content",
        });
    }
}

/**
 * Controller to fetch all content for the authenticated user
 */

export async function getContentAllController(req, res, next) {
    try {
        const contents = await contentModel.find({ userId: req.user.id }).sort({ createdAt: -1 })
        return res.status(200).json({
            success: true,
            data: contents
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message })
    }
}

/**
 * Controller to delete specific content by ID
 */
export async function DeleteContentController(req, res, next) {
    try {
        const contentId = req.params.id
        const deletedContent = await contentModel.findOneAndDelete({ _id: contentId, userId: req.user.id })
        if (!deletedContent) {
            return res.status(404).json({ message: "Content not found or not authorized" })
        }
        return res.status(200).json({
            success: true,
            message: "Content deleted successfully",
            data: deletedContent
        })
    } catch (error) {
        console.error("Delete Content Error:", error.message);
        return res.status(500).json({ 
            success: false,
            error: error.message 
        })
    }
}


export async function getSingleUserContentController(req,res,next) {
    try {
        const id=req.user.id
        const content=await contentModel.find({userId:id})
        if(!content){
            return res.status(404).json({message:"Content not found"})
        }
        return res.status(200).json({
            success:true,
            data:content
        })
    } catch (error) {
        console.error("Get Single User Content Error:", error.message);
        return res.status(500).json({
            success:false,
            error:error.message
        })
    }
}