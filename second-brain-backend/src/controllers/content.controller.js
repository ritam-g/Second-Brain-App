import contentModel from "../models/content.model.js"
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
 *             $ref: '#/components/schemas/Content'
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
export async function saveContentController(req, res, next) {
    try {
        const { url, title } = req.body
        const newContent = await contentModel.create({ url, title })
        return res.status(201).json(newContent)

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message })

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