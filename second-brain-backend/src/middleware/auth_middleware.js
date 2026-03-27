import jwt from "jsonwebtoken"
import userModel from "../models/user.model.js"
import { serializeUser } from "../utils/user-response.util.js"

export async function AuthMiddleware(req, res, next) {
    try {
        const jwtToken = resolveJwtToken(req)
        if (!jwtToken) {
            return res.status(401).json({ 
                success: false,
                message: "Unauthorized - No token provided" 
            })
        }
        const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET)
        // we db call and chek 

        const user = await userModel.findById(decoded.id)
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: "Unauthorized - User not found" 
            })
        }
        req.user = serializeUser(user)
        next()
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        return res.status(401).json({ 
            success: false,
            message: "Unauthorized - Invalid token",
            error: error.message 
        })
    }
}

function resolveJwtToken(req) {
    const cookieToken = String(req.cookies?.jwtToken || "").trim()

    if (cookieToken) {
        return cookieToken
    }

    const authorizationHeader = String(req.headers?.authorization || "").trim()

    if (!authorizationHeader.toLowerCase().startsWith("bearer ")) {
        return ""
    }

    return authorizationHeader.slice(7).trim()
}
