import { Router } from 'express'
import {
  changePasswordController,
  checkAuthController,
  deleteAccountController,
  logoutController,
  registerController,
  updateProfileController,
  userLoginController,
} from '../controllers/auth.controller.js'
import { AuthMiddleware } from '../middleware/auth_middleware.js'

/**   
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *           format: password
 */

const authRouter = Router()

/**  
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
authRouter.post('/register', registerController)

/**  
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
authRouter.post('/login', userLoginController)

/**  
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Check authentication status
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Validation successful
 *       401:
 *         description: Unauthorized
 */
authRouter.get('/me', AuthMiddleware, checkAuthController)

authRouter.patch('/profile', AuthMiddleware, updateProfileController)

authRouter.patch('/password', AuthMiddleware, changePasswordController)

authRouter.delete('/account', AuthMiddleware, deleteAccountController)

/**  
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 */
authRouter.post('/logout', logoutController)

export default authRouter
