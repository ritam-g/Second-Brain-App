import jwt from "jsonwebtoken"
import userModel from "../models/user.model.js"

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
        res.cookie("jwtToken", token, { httpOnly: true })
        
        return res.status(200).json({ 
            success: true,
            message: "Login successful", 
            data: { 
                user: { id: user._id, username: user.username, email: user.email },
                
            } 
    } catch (error) {
        console.error("Logout Error:", error.message);
        return res.status(500).json({ 
            success: false,
            error: error.message 
        })
    }
}
