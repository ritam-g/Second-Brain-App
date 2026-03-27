import { Router } from "express"
import { getGraphController } from "../controllers/graph.controller.js"
import { AuthMiddleware } from "../middleware/auth_middleware.js"

const graphRouter = Router()

// Relationship graph endpoint for the authenticated user's content network.
graphRouter.get("/", AuthMiddleware, getGraphController)

export default graphRouter
