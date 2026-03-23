import { Router } from "express";
import {DeleteContentController, getContentAllController, saveContentController} from "../controllers/content.controller.js";
import { AuthMiddleware } from "../middlewares/auth.Middleware.js";

const contentRouter = Router();

/**   
 * @swagger
 * components:
 *   schemas:
 *     Content:
 *       type: object
 *       required:
 *         - url
 *         - title
 *         - userId
 *       properties:
 *         _id:
 *           type: string
 *         url:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         image:
 *           type: string
 *         type:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         userId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**  
 * @swagger
 * /api/content/save:
 *   post:
 *     summary: Save new content
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
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
 *               title:
 *                 type: string
 *     responses:
 *       201:
 *         description: Content saved successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
contentRouter.post('/save', AuthMiddleware, saveContentController)

/**   
 * @swagger
 * /api/content/get-all:
 *   get:
 *     summary: Get all saved content for the logged-in user
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Content'
 */
contentRouter.get('/get-all', AuthMiddleware, getContentAllController)

/**   
 * @swagger
 * /api/content/delete/{id}:
 *   delete:
 *     summary: Delete content by ID
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The content ID
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       404:
 *         description: Content not found
 */
contentRouter.delete('/delete/:id', AuthMiddleware, DeleteContentController)
export default contentRouter