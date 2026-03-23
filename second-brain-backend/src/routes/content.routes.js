import { Router } from "express";
import {DeleteContentController, getContentAllController, saveContentController} from "../controllers/content.controller.js";

const contentRouter = Router();

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
contentRouter.post('/save', saveContentController)

/**   
 * @swagger
 * /api/content/get-all:
 *   get:
 *     summary: Get all saved content
 *     tags: [Content]
 *     responses:
 *       200:
 *         description: All saved content
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Content'
 *       500:
 *         description: Internal server error
 */
contentRouter.get('/get-all', getContentAllController)
//make proper with comment 
/**   
 * @swagger
 * /api/content/delete/{id}:
 *   delete:
 *     summary: Delete content by ID
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the content to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content deleted successfully
 *       500:
 *         description: Internal server error
 */
contentRouter.delete('/delete/:id', DeleteContentController)
export default contentRouter