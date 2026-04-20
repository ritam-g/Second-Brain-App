import jwt from "jsonwebtoken"
import userModel from "../models/user.model.js"
import { clearUserContentByUserId } from "../services/content-cleanup.service.js"
import { serializeUser } from "../utils/user-response.util.js"

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

/**
 * Creates a new user account.
 * Validates required fields, password length, and handles duplicate email errors.
 * Serializes the user data before returning it in the response.
 */
export async function registerController(req, res, next) {
    try {
        const username = String(req.body?.username || "").trim()
        const password = String(req.body?.password || "")
        const email = normalizeEmail(req.body?.email)

        if (!username || !password || !email) {
            return res.status(400).json({ message: "All fields are required" })
        }
        
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" })
        }

        const user = await userModel.create({
            username,
            password,
            email,
        })

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user: serializeUser(user),
            },
        })
    } catch (error) {
        if (isDuplicateEmailError(error)) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists",
            })
        }

        console.error("Register Error:", error.message);
        return res.status(500).json({ 
            success: false,
            error: error.message 
        })
    }
}

// login route 
/**
 * Authenticates a user and issues a JWT token via a secure cookie.
 * Compares passwords, generates a session token, and returns the serialized user.
 */
export async function userLoginController(req, res, next) {
    try {
        const email = normalizeEmail(req.body?.email)
        const password = String(req.body?.password || "")

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
                user: serializeUser(user),
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
/**
 * Verifies the current session and returns the authenticated user's data.
 * Used by the frontend to maintain persistent login state.
 */
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
/**
 * Updates the authenticated user's display name and avatar URL.
 * Normalizes the avatar URL and ensures the username is provided.
 */
export async function updateProfileController(req, res, next) {
    try {
        const username = String(req.body?.username || "").trim()
        const avatar = normalizeAvatarUrl(req.body?.avatar)

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Display name is required",
            })
        }

        const user = await userModel.findById(req.user.id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }

        user.username = username
        user.avatar = avatar
        await user.save()

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: {
                user: serializeUser(user),
            },
        })
    } catch (error) {
        console.error("Update Profile Error:", error.message)
        return res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}

/**
 * Replaces the user's existing password with a new one.
 * Requires the current password for verification and enforces strength requirements.
 */
export async function changePasswordController(req, res, next) {
    try {
        const currentPassword = String(req.body?.currentPassword || "")
        const newPassword = String(req.body?.newPassword || "")

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required",
            })
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            })
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "Choose a new password different from your current password",
            })
        }

        const user = await userModel.findById(req.user.id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }

        const isMatch = await user.comparePassword(currentPassword)

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect",
            })
        }

        user.password = newPassword
        await user.save()

        return res.status(200).json({
            success: true,
            message: "Password updated successfully",
        })
    } catch (error) {
        console.error("Change Password Error:", error.message)
        return res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}

/**
 * Permanently deletes a user's account and all their archived content.
 * Clears the session cookie and triggers a cleanup of stored files and vectors.
 */
export async function deleteAccountController(req, res, next) {
    try {
        const user = await userModel.findById(req.user.id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }

        await clearUserContentByUserId(String(user._id))
        await user.deleteOne()
        res.clearCookie("jwtToken", cookieOptions)

        return res.status(200).json({
            success: true,
            message: "Account deleted successfully",
        })
    } catch (error) {
        console.error("Delete Account Error:", error.message)
        return res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}

/**
 * Ends the user's session by clearing the authentication cookie.
 */
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

/**
 * Normalizes an email address by trimming and converting to lowercase.
 * 
 * @param {string} value - The email address to normalize.
 * @returns {string} The normalized email address.
 */
function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase()
}

/**
 * Normalizes and validates an avatar URL.
 * 
 * @param {string} value - The avatar URL to normalize.
 * @returns {string} The normalized avatar URL.
 * @throws {Error} If the URL is invalid or uses an unsupported protocol.
 */
function normalizeAvatarUrl(value) {
    const normalizedValue = String(value || "").trim()

    if (!normalizedValue) {
        return ""
    }

    try {
        const parsedUrl = new URL(normalizedValue)

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            throw new Error("Avatar URL must use http or https")
        }

        return parsedUrl.toString()
    } catch {
        throw new Error("Avatar URL must be a valid public image URL")
    }
}

/**
 * Checks if an error is a duplicate email error from MongoDB.
 * 
 * @param {Error} error - The error object to check.
 * @returns {boolean} True if it's a duplicate email error, false otherwise.
 */
function isDuplicateEmailError(error) {
    return Number(error?.code) === 11000 && String(error?.message || "").includes("email")
}
