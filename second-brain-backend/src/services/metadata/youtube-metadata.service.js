import {
    generateTagsFromTitle,
    normalizeTitle,
    normalizeUrl,
    platformFallbackImage,
} from "./metadata.shared.js"
import {
    buildYouTubeThumbnail,
    extractYouTubeId,
    normalizeYouTubeUrl,
} from "../../utils/youtube.util.js"

// Resolves YouTube metadata from YouTube's own oEmbed endpoint so saved videos keep the real title and thumbnail.
// Input: original YouTube URL from the save form.
// Output: metadata object shaped like the generic scraper response.
export async function getYouTubeMetadata(url) {
    const oEmbedMetadata = await fetchYouTubeOEmbed(url)
    const videoId = extractYouTubeId(url)
    const canonicalUrl = normalizeYouTubeUrl(url)
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
        authorName,
        siteName: "youtube",
        type: "youtube",
        url: canonicalUrl || url,
        videoId,
        tags: [...new Set(tags.filter(Boolean))],
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
