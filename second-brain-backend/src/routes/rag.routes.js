import { Router } from "express"
import { ragQueryController } from "../controllers/rag.controller.js"
import { AuthMiddleware } from "../middleware/auth_middleware.js"
import { aiLimiter } from "../middleware/rateLimiter/rateLimiter.js"

const ragRouter = Router()

/**
 * Deep Focus chat endpoint. 
 * Allows users to ask questions about their archived content and receive AI-grounded answers with citations.
 */
ragRouter.post("/rag/query", aiLimiter, AuthMiddleware, ragQueryController)

export default ragRouter
