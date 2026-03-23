import jwt from "jsonwebtoken"
import userModel from "../models/user.model.js"

export async function AuthMiddleware(req, res, next) {
    try {
        const { jwtToken } = req.cookies
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
        req.user = {
            id: user._id,
            username: user.username,
            email: user.email
        }
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