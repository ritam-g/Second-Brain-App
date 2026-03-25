import {
    generateTagsFromTitle,
    normalizeTitle,
    normalizeUrl,
    platformFallbackImage,
} from "./metadata.shared.js"

// Resolves YouTube metadata from YouTube's own oEmbed endpoint so saved videos keep the real title and thumbnail.
// Input: original YouTube URL from the save form.
// Output: metadata object shaped like the generic scraper response.
export async function getYouTubeMetadata(url) {
    const oEmbedMetadata = await fetchYouTubeOEmbed(url)
    const videoId = extractYouTubeId(url)
    const title = normalizeTitle(oEmbedMetadata?.title) || "YouTube Video"
    const image = normalizeUrl(oEmbedMetadata?.thumbnail_url, url)
        || buildYouTubeThumbnail(videoId)
        || platformFallbackImage("youtube")
    const authorName = normalizeTitle(oEmbedMetadata?.author_name)
    const tags = [
        ...generateTagsFromTitle(title),
        ...generateTagsFromTitle(authorName),
        "youtube",
    ]

    return {
        title,
        description: "",
        image,
        siteName: "youtube",
        type: "youtube",
        url,
        tags: [...new Set(tags.filter(Boolean))],
    }
}

// Builds a standard YouTube thumbnail URL from a resolved video id.
// Input: YouTube video id string.
// Output: thumbnail URL string or an empty string.
export function buildYouTubeThumbnail(videoId) {
    if (!videoId) {
        return ""
    }

    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

// Extracts the canonical YouTube video id from watch, short, embed, and youtu.be URLs.
// Input: YouTube URL string.
// Output: video id string or an empty string.
export function extractYouTubeId(url) {
    try {
        const parsedUrl = new URL(url)
        const hostname = parsedUrl.hostname.toLowerCase()

        if (hostname.includes("youtu.be")) {
            return parsedUrl.pathname.replace(/^\/+/, "").split("/")[0] || ""
        }

        if (parsedUrl.pathname.startsWith("/shorts/") || parsedUrl.pathname.startsWith("/embed/")) {
            return parsedUrl.pathname.split("/").filter(Boolean)[1] || ""
        }

        return parsedUrl.searchParams.get("v") || ""
    } catch {
        return ""
    }
}

// Fetches YouTube oEmbed metadata for a public video, short, or youtu.be link.
// Input: original YouTube URL.
// Output: parsed oEmbed JSON object or null when unavailable.
async function fetchYouTubeOEmbed(url) {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    const response = await fetch(oEmbedUrl, {
        headers: {
            "user-agent": "Mozilla/5.0",
            "accept": "application/json",
        },
    })

    if (!response.ok) {
        return null
    }

    const payload = await response.json()
    return payload && typeof payload === "object" ? payload : null
}
