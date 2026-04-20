import { Router } from "express"
import { ragQueryController } from "../controllers/rag.controller.js"
import { AuthMiddleware } from "../middleware/auth_middleware.js"
import { aiLimiter } from "../middleware/rateLimiter/rateLimiter.js"

const ragRouter = Router()

// Deep Focus chat endpoint.
// The frontend posts a question here and receives a grounded answer plus cited source chunks.
ragRouter.post("/rag/query", aiLimiter, AuthMiddleware, ragQueryController)

export default ragRouter
