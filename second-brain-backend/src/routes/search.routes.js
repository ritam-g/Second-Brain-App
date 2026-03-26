import { Router } from "express"
import { semanticSearchController } from "../controllers/search.controller.js"
import { AuthMiddleware } from "../middlewares/auth.Middleware.js"

const searchRouter = Router()

// New semantic search endpoint.
searchRouter.post("/search/semantic", AuthMiddleware, semanticSearchController)

// Backward-compatible alias for any existing clients using the older route path.
searchRouter.post("/search", AuthMiddleware, semanticSearchController)

export default searchRouter
