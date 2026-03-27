import { Router } from "express"
import { getResurfacedController } from "../controllers/resurfacing.controller.js"
import { AuthMiddleware } from "../middlewares/auth.middleware.js"

const resurfacingRouter = Router()

// Time-based memory resurfacing endpoint for the authenticated user's library.
resurfacingRouter.get("/", AuthMiddleware, getResurfacedController)

export default resurfacingRouter
