// Normalizes user documents before they are returned to the frontend.
// Input: mongoose user document or plain object.
// Output: safe user payload consumed by the frontend auth/profile UI.
export function serializeUser(user) {
    if (!user) {
        return null
    }

    const normalizedUser = typeof user?.toObject === "function"
        ? user.toObject()
        : { ...(user || {}) }

    return {
        id: String(normalizedUser._id || normalizedUser.id || "").trim(),
        username: String(normalizedUser.username || "").trim(),
        email: String(normalizedUser.email || "").trim(),
        avatar: String(normalizedUser.avatar || "").trim(),
        createdAt: normalizedUser.createdAt || null,
    }
}
