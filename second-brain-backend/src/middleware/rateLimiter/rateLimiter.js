/**
 * Rate Limiter Factory & Configuration
 * 
 * This module creates rate limiter instances with smart key generation:
 * - If user is authenticated → uses userId (fair per-user limiting)
 * - If user is not authenticated → falls back to IP address
 * 
 * This ensures fair usage limits regardless of authentication status.
 */

import rateLimit from "express-rate-limit"
import limiterPresets from "./limiterPresets.js"

/**
 * Generate a unique key for rate limiting
 * Priority: userId > IP address
 * 
 * This ensures authenticated users have per-user limits while
 * unauthenticated users are limited by IP
 * @param {Object} req - Express request object
 * @returns {string} Unique key for the user/IP
 */
const keyGenerator = (req) => {
    // If user is authenticated, use their ID for fair per-user limiting
    if (req.user?.id) {
        return `user_${req.user.id}`
    }

    // Fallback to IP address for unauthenticated requests
    // Handle X-Forwarded-For for proxied requests (common in production)
    const ip = req.headers["x-forwarded-for"] || req.ip || req.socket.remoteAddress
    return `ip_${ip}`
}

/**
 * Create a rate limiter with the given preset configuration
 * @param {string} presetName - Key from limiterPresets object
 * @returns {Function} Express middleware function
 */
export const createLimiter = (presetName) => {
    const preset = limiterPresets[presetName]

    if (!preset) {
        throw new Error(
            `Invalid limiter preset: ${presetName}. Available presets: ${Object.keys(limiterPresets).join(", ")}`
        )
    }

    return rateLimit({
        ...preset,
        keyGenerator, // Use our custom key generator for smart limiting
        handler: (req, res) => {
            // Custom error handler to return JSON
            res.status(429).json(preset.message)
        },
    })
}

/**
 * Pre-configured limiter instances
 * Use these directly in route definitions
 */
export const authLimiter = createLimiter("auth")
export const uploadLimiter = createLimiter("upload")
export const aiLimiter = createLimiter("ai")
export const searchLimiter = createLimiter("search")
export const generalLimiter = createLimiter("general")
export const graphLimiter = createLimiter("graph")
export const resurfacingLimiter = createLimiter("resurfacing")

export default createLimiter
