/**
 * Rate Limiter Presets
 * Defines different rate limiting configurations for various route types
 * 
 * This file centralizes all rate limit configurations to make them easy to adjust
 * without modifying individual route files.
 */

export const limiterPresets = {
    // AUTH ROUTES: Very strict - prevent brute force attacks
    // 5 requests per minute per user/IP
    auth: {
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 5,
        message: {
            success: false,
            message: "Too many authentication attempts. Please try again after a minute.",
        },
        standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
        legacyHeaders: false, // Disable `X-RateLimit-*` headers
        skipSuccessfulRequests: false, // Count all requests, including successful ones
    },

    // UPLOAD ROUTES: Very strict - resource intensive & quota-sensitive
    // 10 requests per 10 minutes per user/IP
    upload: {
        windowMs: 10 * 60 * 1000, // 10 minutes
        max: 10,
        message: {
            success: false,
            message: "Upload limit exceeded. Please wait before uploading more files.",
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
    },

    // AI/RAG ROUTES: Strict - computationally expensive & token-costly
    // 20 requests per 5 minutes per user
    ai: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 10,
        message: {
            success: false,
            message: "AI request limit exceeded. Please wait before making more requests.",
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false, // Count all requests to prevent abuse
    },

    // SEARCH ROUTES: Medium limits
    // 50 requests per minute per user
    search: {
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 20,
        message: {
            success: false,
            message: "Search limit exceeded. Please try again in a moment.",
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
    },

    // GENERAL API: Loose limits for non-critical endpoints
    // 100 requests per minute per user
    general: {
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 10,
        message: {
            success: false,
            message: "Too many requests. Please try again later.",
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
    },

    // GRAPH ROUTES: Medium-strict
    // 30 requests per minute per user
    graph: {
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 15,
        message: {
            success: false,
            message: "Graph query limit exceeded. Please try again soon.",
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
    },

    // RESURFACING ROUTES: Medium
    // 30 requests per minute per user
    resurfacing: {
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 30,
        message: {
            success: false,
            message: "Resurfacing query limit exceeded. Please try again soon.",
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
    },
}

export default limiterPresets
