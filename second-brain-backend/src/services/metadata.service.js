import ogs from "open-graph-scraper"
import {
    detectPlatform,
    extractBestDescription,
    extractBestImage,
    extractBestTitle,
    generateTagsFromTitle,
    mapType,
    platformFallbackImage,
    splitTags,
} from "./metadata/metadata.shared.js"
import {
    buildYouTubeThumbnail,
    extractYouTubeId,
    getYouTubeMetadata,
} from "./metadata/youtube-metadata.service.js"

// Fetches and normalizes metadata for any supported saved URL.
// Input: original source URL string from the save form.
// Output: metadata object containing title, description, image, type, url, and tags.
export async function getMetadata(url) {
    const platform = detectPlatform(url)

    try {
        if (platform === "youtube") {
            return await getYouTubeMetadata(url)
        }

        const { error, result } = await ogs({ url })

        if (error || !result) {
            return buildMetadataFallback(url, platform)
        }

        const title = extractBestTitle(result, url, platform)
        const description = extractBestDescription(result)
        const image = extractBestImage(result, url, platform)

        let tags = []

        if (result.ogVideoTag) {
            const videoTags = Array.isArray(result.ogVideoTag)
                ? result.ogVideoTag
                : [result.ogVideoTag]

            videoTags.forEach(tag => {
                tags.push(...splitTags(tag))
            })
        }

        if (result.keywords) {
            const keywordTags = Array.isArray(result.keywords)
                ? result.keywords
                : [result.keywords]

            keywordTags.forEach(tag => {
                tags.push(...splitTags(tag))
            })
        }

        if (title && title !== "No title") {
            tags.push(...generateTagsFromTitle(title))
        }

        tags.push(platform)

        return {
            title,
            description,
            image,
            siteName: result.ogSiteName || platform,
            type: mapType(url, result.ogType),
            url: result.ogUrl || url,
            tags: [...new Set(tags)],
        }
    } catch (error) {
        console.error("Metadata Error:", error.message)
        return buildMetadataFallback(url, platform)
    }
}

// Builds a safe fallback metadata object when external scraping fails.
// Input: source URL string and normalized platform key.
// Output: metadata object with deterministic title/image/type defaults.
function buildMetadataFallback(url, platform) {
    const fallbackTitle = platform === "youtube"
        ? "YouTube Video"
        : extractFallbackTitle(url)
    const fallbackImage = platform === "youtube"
        ? buildYouTubeThumbnail(extractYouTubeId(url)) || platformFallbackImage(platform)
        : platformFallbackImage(platform) || ""

    return {
        title: fallbackTitle,
        description: "",
        image: fallbackImage,
        siteName: platform,
        type: mapType(url, null),
        url,
        tags: [platform],
    }
}

// Derives a readable fallback title from a generic URL when no better metadata exists.
// Input: original source URL string.
// Output: short fallback title string.
function extractFallbackTitle(url) {
    try {
        const parsedUrl = new URL(url)

        return parsedUrl.pathname
            .split("/")
            .filter(Boolean)
            .pop()
            ?.replace(/[-_]/g, " ")
            || "No title"
    } catch {
        return "No title"
    }
}
