import jwt from "jsonwebtoken"
import userModel from "../models/user.model.js"

const isProduction = process.env.NODE_ENV === 'production'

// Cookie options adapt to environment.
// Production (Render HTTPS): secure + sameSite=none required for cross-origin credentialed requests.
// Development (HTTP localhost): secure=false, sameSite=lax is enough.
const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
}

export async function registerController(req, res, next) {
    try {
        const { username, password, email } = req.body
        if (!username || !password || !email) {
            return res.status(400).json({ message: "All fields are required" })
        }
        
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" })
        }

        const user = await userModel.create({
            username,
            password,
            email
        })

        const { password: _, ...userResponse } = user.toObject();
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: userResponse
        })
    } catch (error) {
        console.error("Register Error:", error.message);
        return res.status(500).json({ 
            success: false,
            error: error.message 
        })
    }
}

// login route 

export async function userLoginController(req, res, next) {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" })
        }
        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" })
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
        res.cookie("jwtToken", token, cookieOptions)
        
        return res.status(200).json({ 
            success: true,
            message: "Login successful", 
            data: { 
                user: { id: user._id, username: user.username, email: user.email },
                
            } 
        })
    } catch (error) {
        console.error("Login Error:", error.message);
        return res.status(500).json({ 
            success: false,
            error: error.message 
        })
    }
}

export async function checkAuthController(req, res, next) {
    try {
        return res.status(200).json({
            success: true,
            message: "User fetched successfully",
            data: { 
                user: req.user 
            }
        })
    } catch (error) {
        console.error("Check Auth Error:", error.message);
        return res.status(500).json({ 
            success: false,
            error: error.message 
        })
    }
}

export async function logoutController(req, res, next) {
    try {
        res.clearCookie("jwtToken", cookieOptions);
        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        })
    } catch (error) {
        console.error("Logout Error:", error.message);
        return res.status(500).json({ 
            success: false,
            error: error.message 
        })
    }
}
