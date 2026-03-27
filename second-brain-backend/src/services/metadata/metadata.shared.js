import { cleanTitle } from "../../utils/clean-title.js"

const maxMetadataTitleCharacters = 80
const maxMetadataDescriptionCharacters = 180

// Detects which metadata strategy should be used based on the source URL.
// Input: original content URL string.
// Output: normalized platform key such as `youtube`, `twitter`, or `web`.
export function detectPlatform(url) {
    const normalizedUrl = (url || "").toLowerCase()

    if (
        normalizedUrl.includes("youtube.com")
        || normalizedUrl.includes("youtu.be")
    ) {
        return "youtube"
    }

    if (
        normalizedUrl.includes("twitter.com")
        || normalizedUrl.includes("x.com")
    ) {
        return "twitter"
    }

    if (normalizedUrl.includes("linkedin.com")) return "linkedin"
    if (normalizedUrl.includes("instagram.com")) return "instagram"
    return "web"
}

// Maps metadata and URL signals into the content type stored in MongoDB.
// Input: original content URL and optional Open Graph type string.
// Output: saved content type string.
export function mapType(url, ogType) {
    const normalizedUrl = (url || "").toLowerCase()
    const normalizedType = String(ogType || "").toLowerCase()

    if (
        normalizedUrl.includes("youtube.com")
        || normalizedUrl.includes("youtu.be")
    ) {
        return "youtube"
    }

    if (
        normalizedUrl.includes("twitter.com")
        || normalizedUrl.includes("x.com")
    ) {
        return "tweet"
    }

    if (
        normalizedUrl.endsWith(".pdf")
        || normalizedType === "application/pdf"
        || normalizedType.includes("pdf")
    ) {
        return "pdf"
    }

    if (normalizedType.includes("video")) {
        return "article"
    }

    if (normalizedUrl.includes("linkedin.com")) {
        return "linkedin"
    }

    if (normalizedUrl.includes("instagram.com")) {
        return "instagram"
    }

    if (normalizedUrl.includes("github.com")) {
        return "github"
    }

    if (normalizedUrl.includes("x.com")) {
        return "x"
    }

    return "article"
}

// Provides a platform-specific fallback image when OG scraping yields nothing usable.
// Input: normalized platform key.
// Output: absolute fallback image URL or an empty string.
export function platformFallbackImage(platform) {
    const images = {
        youtube: "https://www.youtube.com/img/desktop/yt_1200.png",
        twitter: "https://abs.twimg.com/icons/apple-touch-icon-192x192.png",
        linkedin: "https://static.licdn.com/scds/common/u/images/logos/favicons/v1/favicon.ico",
        instagram: "https://static.cdninstagram.com/rsrc.php/v3/yt/r/30PrGfR3xhB.png",
    }

    return images[platform] || ""
}

// Chooses the cleanest title candidate from Open Graph, Twitter, JSON-LD, and description-derived signals.
// Input: scraper result object, source URL, and normalized platform key.
// Output: saved title string or `No title`.
export function extractBestTitle(result, sourceUrl, platform) {
    const descriptionFallbackTitle = buildTitleFromDescription(
        extractBestDescription(result),
        platform,
    )
    const jsonLdTitles = collectJsonLdTitles(result?.jsonLD)
    const titleCandidates = [
        ...(platform === "linkedin" ? jsonLdTitles : []),
        result?.ogTitle,
        result?.twitterTitle,
        descriptionFallbackTitle,
        ...(platform !== "linkedin" ? jsonLdTitles : []),
        extractFromUrl(sourceUrl),
    ]

    for (const candidate of titleCandidates) {
        const normalized = normalizeTitle(candidate)

        if (!normalized || isPoorTitleCandidate(normalized, platform)) {
            continue
        }

        return normalized
    }

    if (platform === "twitter") {
        return buildTwitterFallbackTitle(sourceUrl)
    }

    if (platform === "linkedin") {
        return buildLinkedInFallbackTitle(sourceUrl)
    }

    return "No title"
}

// Chooses the cleanest description candidate from Open Graph, Twitter, and JSON-LD metadata.
// Input: scraper result object.
// Output: cleaned description string.
export function extractBestDescription(result) {
    const descriptionCandidates = [
        result?.ogDescription,
        result?.twitterDescription,
        ...collectJsonLdDescriptions(result?.jsonLD),
    ]

    for (const candidate of descriptionCandidates) {
        const normalized = normalizeDescription(candidate)

        if (normalized) {
            return normalized
        }
    }

    return ""
}

// Chooses the best image candidate from OG, Twitter, JSON-LD, and scraper fallbacks.
// Input: scraper result object, source URL, and platform key.
// Output: absolute preview image URL or platform fallback image.
export function extractBestImage(result, sourceUrl, platform) {
    const imageCandidates = [
        ...collectImageCandidates(result?.ogImage),
        ...collectImageCandidates(result?.twitterImage),
        ...collectImageCandidates(result?.ogImageSecureUrl),
        ...collectImageCandidates(result?.twitterImageSrc),
        ...collectImageCandidates(result?.image),
        ...collectImageCandidates(result?.images),
        ...collectJsonLdImages(result?.jsonLD),
        ...collectImageCandidates(result?.favicon),
    ]

    const image = uniqueValidUrls(imageCandidates, sourceUrl)[0]

    if (image) {
        return image
    }

    return platformFallbackImage(platform) || ""
}

// Splits keyword-like metadata fields into tag tokens.
// Input: free-form keyword string.
// Output: sanitized tag array.
export function splitTags(str) {
    if (!str || typeof str !== "string") return []

    return str
        .split(/[\s,]+/)
        .map(sanitizeTag)
        .filter(t => t.length > 2)
}

// Derives compact tags from a saved title.
// Input: saved title string.
// Output: lowercase tag array.
export function generateTagsFromTitle(title) {
    return title
        .toLowerCase()
        .split(" ")
        .map(sanitizeTag)
        .filter(w => w.length > 3)
        .slice(0, 5)
}

// Normalizes saved title text so metadata stays readable and compact.
// Input: raw title string.
// Output: cleaned title string.
export function normalizeTitle(title) {
    if (!title || typeof title !== "string") {
        return ""
    }

    const cleaned = stripLeadingHashtagWall(
        cleanTitle(title),
    )
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxMetadataTitleCharacters)

    return cleaned
}

// Normalizes description text so metadata cards do not store raw hashtag walls.
// Input: raw description string.
// Output: cleaned description string.
export function normalizeDescription(description) {
    if (!description || typeof description !== "string") {
        return ""
    }

    const cleaned = stripLeadingHashtagWall(
        description
            .replace(/\s+/g, " ")
            .trim(),
    )
        .replace(/^[^\p{L}\p{N}]+/u, "")
        .trim()
        .slice(0, maxMetadataDescriptionCharacters)

    if (!cleaned || looksLikeHashtagWall(cleaned)) {
        return ""
    }

    return cleaned
}

// Resolves relative image URLs against the source page and filters invalid preview targets.
// Input: candidate URL value and source page URL.
// Output: absolute URL string or an empty string.
export function normalizeUrl(candidate, sourceUrl) {
    if (!candidate || typeof candidate !== "string") {
        return ""
    }

    const trimmed = candidate.trim()

    if (!trimmed) {
        return ""
    }

    if (
        trimmed.startsWith("data:")
        || trimmed.startsWith("javascript:")
    ) {
        return ""
    }

    try {
        const normalized = new URL(trimmed, sourceUrl).toString()

        if (isBlockedImageUrl(normalized)) {
            return ""
        }

        return normalized
    } catch {
        return ""
    }
}

function collectImageCandidates(value) {
    if (!value) return []

    if (typeof value === "string") {
        return [value]
    }

    if (Array.isArray(value)) {
        return value.flatMap(item => collectImageCandidates(item))
    }

    if (typeof value === "object") {
        return [
            value.url,
            value.secureUrl,
            value.src,
            value.image,
        ].filter(Boolean)
    }

    return []
}

function collectJsonLdTitles(jsonLd) {
    if (!jsonLd) return []

    const entries = Array.isArray(jsonLd) ? jsonLd : [jsonLd]

    return entries.flatMap(entry => {
        if (!entry || typeof entry !== "object") {
            return []
        }

        return [
            entry.headline,
            entry.name,
            entry.alternativeHeadline,
        ].filter(Boolean)
    })
}

function collectJsonLdDescriptions(jsonLd) {
    if (!jsonLd) return []

    const entries = Array.isArray(jsonLd) ? jsonLd : [jsonLd]

    return entries.flatMap(entry => {
        if (!entry || typeof entry !== "object") {
            return []
        }

        return [
            entry.description,
            entry.articleBody,
        ].filter(Boolean)
    })
}

function collectJsonLdImages(jsonLd) {
    if (!jsonLd) return []

    const entries = Array.isArray(jsonLd) ? jsonLd : [jsonLd]

    return entries.flatMap(entry => {
        if (!entry || typeof entry !== "object") {
            return []
        }

        return collectImageCandidates(entry.image)
    })
}

function uniqueValidUrls(candidates, sourceUrl) {
    const seen = new Set()
    const valid = []

    for (const candidate of candidates) {
        const normalized = normalizeUrl(candidate, sourceUrl)

        if (!normalized || seen.has(normalized)) {
            continue
        }

        seen.add(normalized)
        valid.push(normalized)
    }

    return valid
}

function isBlockedImageUrl(imageUrl) {
    try {
        const parsed = new URL(imageUrl)
        const pathname = parsed.pathname.toLowerCase()
        const hostname = parsed.hostname.toLowerCase()

        if (pathname.includes("/emoji/")) {
            return true
        }

        if (pathname.includes("favicon") || pathname.endsWith(".ico")) {
            return true
        }

        if (
            hostname.includes("twimg.com")
            && pathname.includes("/emoji/")
        ) {
            return true
        }

        return false
    } catch {
        return true
    }
}

function isStatusId(value) {
    return /^\d{8,}$/.test(String(value || "").trim())
}

function buildTwitterFallbackTitle(sourceUrl) {
    try {
        const segments = new URL(sourceUrl).pathname
            .split("/")
            .filter(Boolean)

        const username = segments.find(
            segment => segment && segment.toLowerCase() !== "status",
        )

        if (username && username.toLowerCase() !== "i" && username.toLowerCase() !== "web") {
            return `Tweet by @${username}`
        }
    } catch {
        return "Tweet"
    }

    return "Tweet"
}

function buildLinkedInFallbackTitle(sourceUrl) {
    try {
        const segments = new URL(sourceUrl).pathname
            .split("/")
            .filter(Boolean)

        if (segments[0] === "posts" && segments[1]) {
            return cleanTitle(segments[1].replace(/[-_]/g, " "))
        }
    } catch {
        return "LinkedIn post"
    }

    return "LinkedIn post"
}

function extractFromUrl(url) {
    try {
        const parsedUrl = new URL(url)

        if (detectPlatform(url) === "youtube") {
            return ""
        }

        return parsedUrl.pathname
            .split("/")
            .filter(Boolean)
            .pop()
            ?.replace(/[-_]/g, " ") || ""
    } catch {
        return ""
    }
}

function sanitizeTag(tag) {
    if (!tag || typeof tag !== "string") {
        return ""
    }

    return tag
        .toLowerCase()
        .replace(/^[^a-z0-9]+/i, "")
        .replace(/[^a-z0-9]+$/i, "")
        .trim()
}

function buildTitleFromDescription(description, platform) {
    const normalizedDescription = normalizeDescription(description)

    if (!normalizedDescription) {
        return ""
    }

    const sentences = normalizedDescription
        .split(/[.!?]/)
        .map(sentence => sentence.trim())
        .filter(Boolean)

    const candidate = sentences.find(sentence => {
        const wordCount = sentence.split(/\s+/).filter(Boolean).length

        return wordCount >= 3
            && wordCount <= 12
            && !isPoorTitleCandidate(sentence, platform)
            && !looksLikeContactLine(sentence)
    })

    return candidate ? normalizeTitle(candidate) : ""
}

function isPoorTitleCandidate(value, platform) {
    const normalizedValue = String(value || "").trim()
    const lowerCasedValue = normalizedValue.toLowerCase()

    if (!normalizedValue) {
        return true
    }

    if (platform === "twitter" && isStatusId(normalizedValue)) {
        return true
    }

    if (looksLikeHashtagWall(normalizedValue)) {
        return true
    }

    if (looksLikeContactLine(normalizedValue)) {
        return true
    }

    if (["linkedin", "instagram", "twitter", "tweet", "post"].includes(lowerCasedValue)) {
        return true
    }

    return false
}

function looksLikeHashtagWall(value) {
    const normalizedValue = String(value || "").trim()
    const hashtags = normalizedValue.match(/#[a-z0-9][a-z0-9-]*/gi) || []
    const words = normalizedValue.match(/[a-z0-9]+/gi) || []

    return hashtags.length >= 3 && hashtags.length >= Math.ceil(words.length * 0.4)
}

function looksLikeContactLine(value) {
    const normalizedValue = String(value || "")

    return /\b\S+@\S+\.\S+\b/.test(normalizedValue)
        || /\+?\d[\d\s().-]{7,}\d/.test(normalizedValue)
        || /\b(?:linkedin|github|portfolio|leetcode|https?:\/\/|www\.)\b/i.test(normalizedValue)
}

function stripLeadingHashtagWall(value) {
    return String(value || "")
        .replace(/^(?:#[a-z0-9][a-z0-9-]*\s*){3,}/gi, "")
        .trim()
}
