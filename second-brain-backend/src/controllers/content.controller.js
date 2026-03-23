import contentModel from "../models/content.model.js"
import { getMetadata } from "../services/metadata.service.js"
//maek proper with comment 
/** 
 * @swagger
 * /api/content/save:
 *   post:
 *     summary: Save content
 *     tags: [Content]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Content saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Content'
 *       500:
 *         description: Internal server error
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
 * @swagger
 * /api/content:
 *   get:
 *     summary: Get all content
 *     tags: [Content]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Content'
 *       500:
 *         description: Internal server error
 */

export async function getContentAllController(req, res, next) {
    try {
        const contents = await contentModel.find().sort({ createdAt: -1 })
        return res.status(200).json(contents)
    } catch (error) {
        log.error(error);
        return res.status(500).json({ error: error.message })


    }

}

export async function DeleteContentController(req, res, next) {
    try {
        const contentId = req.params.id
        const deletedContent = await contentModel.findByIdAndDelete(contentId)
        return res.status(200).json(
            {
                message: "Content deleted successfully", deletedContent
            }
        )
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message })
    }
}