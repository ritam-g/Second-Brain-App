import { Router } from "express"
import { getResurfacedController } from "../controllers/resurfacing.controller.js"
import { AuthMiddleware } from "../middleware/auth_middleware.js"
import { resurfacingLimiter } from "../middleware/rateLimiter/rateLimiter.js"

const resurfacingRouter = Router()

/**
 * @route GET /api/resurfacing/
 * @description Time-based memory resurfacing endpoint for the authenticated user's library.
 * @access Private
 */
resurfacingRouter.get("/", resurfacingLimiter, AuthMiddleware, getResurfacedController)

export default resurfacingRouter
