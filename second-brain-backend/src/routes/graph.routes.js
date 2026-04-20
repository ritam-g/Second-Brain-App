import { Router } from "express"
import { getGraphController } from "../controllers/graph.controller.js"
import { AuthMiddleware } from "../middleware/auth_middleware.js"
import { graphLimiter } from "../middleware/rateLimiter/rateLimiter.js"

const graphRouter = Router()

// Relationship graph endpoint for the authenticated user's content network.
graphRouter.get("/",  graphLimiter,AuthMiddleware, getGraphController)

export default graphRouter
