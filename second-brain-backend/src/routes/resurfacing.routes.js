import { Router } from "express"
import { getResurfacedController } from "../controllers/resurfacing.controller.js"
import { AuthMiddleware } from "../middleware/auth_middleware.js"
import { resurfacingLimiter } from "../middleware/rateLimiter/rateLimiter.js"

const resurfacingRouter = Router()

/**
 * Memory resurfacing endpoint.
 * Randomly retrieves archived items from the user's past to encourage review and reinforcement of knowledge.
 */
resurfacingRouter.get("/", resurfacingLimiter, AuthMiddleware, getResurfacedController)

export default resurfacingRouter
