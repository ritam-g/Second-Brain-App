const youtubeHostPattern = /(^|\.)youtube\.com$/i
const shortHostPattern = /(^|\.)youtu\.be$/i

// Detects whether a URL belongs to a supported YouTube host.
// Input: raw URL string.
// Output: boolean indicating whether the URL should use the YouTube pipeline.
export function isYouTubeUrl(url) {
    try {
        const parsedUrl = new URL(String(url || "").trim())
        const hostname = parsedUrl.hostname.toLowerCase()

        return youtubeHostPattern.test(hostname) || shortHostPattern.test(hostname)
    } catch {
        return false
    }
}

// Extracts the canonical YouTube video id from watch, short, embed, and youtu.be URLs.
// Input: YouTube URL string.
// Output: video id string or an empty string.
export function extractYouTubeId(url) {
    try {
        const parsedUrl = new URL(String(url || "").trim())
        const hostname = parsedUrl.hostname.toLowerCase()

        if (shortHostPattern.test(hostname)) {
            return parsedUrl.pathname.replace(/^\/+/, "").split("/")[0] || ""
        }

        if (!youtubeHostPattern.test(hostname)) {
            return ""
        }

        if (parsedUrl.pathname.startsWith("/embed/") || parsedUrl.pathname.startsWith("/shorts/")) {
            return parsedUrl.pathname.split("/").filter(Boolean)[1] || ""
        }

        return parsedUrl.searchParams.get("v") || ""
    } catch {
        return ""
    }
}

// Builds a standard YouTube thumbnail URL from a resolved video id.
// Input: YouTube video id string.
// Output: thumbnail URL string or an empty string.
export function buildYouTubeThumbnail(videoId) {
    const normalizedVideoId = String(videoId || "").trim()

    if (!normalizedVideoId) {
        return ""
    }

    return `https://img.youtube.com/vi/${normalizedVideoId}/hqdefault.jpg`
}

// Canonicalizes a YouTube URL so duplicate checks treat watch, embed, and youtu.be forms as one video.
// Input: raw YouTube URL string.
// Output: stable watch URL or the trimmed original value when no video id can be resolved.
export function normalizeYouTubeUrl(url) {
    const normalizedUrl = String(url || "").trim()
    const videoId = extractYouTubeId(normalizedUrl)

    if (!videoId) {
        return normalizedUrl
    }

    return `https://www.youtube.com/watch?v=${videoId}`
}
