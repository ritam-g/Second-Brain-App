import { Router } from "express"
import { semanticSearchController } from "../controllers/search.controller.js"
import { AuthMiddleware } from "../middleware/auth_middleware.js"
import { searchLimiter } from "../middleware/rateLimiter/rateLimiter.js"

const searchRouter = Router()

// New semantic search endpoint.
searchRouter.post("/search/semantic", searchLimiter, AuthMiddleware, semanticSearchController)

// Backward-compatible alias for any existing clients using the older route path.
searchRouter.post("/search", searchLimiter, AuthMiddleware, semanticSearchController)

export default searchRouter
