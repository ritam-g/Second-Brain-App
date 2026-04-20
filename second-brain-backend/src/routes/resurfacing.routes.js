import { Router } from "express"
import { getResurfacedController } from "../controllers/resurfacing.controller.js"
import { AuthMiddleware } from "../middleware/auth_middleware.js"
import { resurfacingLimiter } from "../middleware/rateLimiter/rateLimiter.js"

const resurfacingRouter = Router()

// Time-based memory resurfacing endpoint for the authenticated user's library.
resurfacingRouter.get("/", resurfacingLimiter, AuthMiddleware, getResurfacedController)

export default resurfacingRouter
