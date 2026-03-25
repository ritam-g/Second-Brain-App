import ogs from "open-graph-scraper";
import { cleanTitle } from "../utils/CleanTitle.js";

export async function getMetadata(url) {
    try {
        const { error, result } = await ogs({ url });
        const platform = detectPlatform(url);

        if (error || !result) {
            return fallback(url, platform);
        }

        const title = extractBestTitle(result, url, platform);
        const description = extractBestDescription(result);

        const image = extractBestImage(result, url, platform);

        let tags = [];

        if (result.ogVideoTag) {
            const videoTags = Array.isArray(result.ogVideoTag)
                ? result.ogVideoTag
                : [result.ogVideoTag];

            videoTags.forEach(tag => {
                tags.push(...splitTags(tag));
            });
        }

        if (result.keywords) {
            const keywordTags = Array.isArray(result.keywords)
                ? result.keywords
                : [result.keywords];

            keywordTags.forEach(tag => {
                tags.push(...splitTags(tag));
            });
        }

        if (title && title !== "No title") {
            tags.push(...generateTagsFromTitle(title));
        }

        tags.push(platform);
        tags = [...new Set(tags)];
        console.log(result);
        
        return {
            title,
            description,
            image,
            siteName: result.ogSiteName || platform,
            type: mapType(url, result.requestUrl),
            url: result.ogUrl || url,
            tags,
        };
    } catch (err) {
        console.error("Metadata Error:", err.message);
        return fallback(url, detectPlatform(url));
    }
}

function mapType(url, ogType) {
    const normalizedUrl = (url || "").toLowerCase();
    const normalizedType = String(ogType || "").toLowerCase();

    if (
        normalizedUrl.includes("youtube.com") ||
        normalizedUrl.includes("youtu.be")
    ) {
        return "youtube";
    }

    if (
        normalizedUrl.includes("twitter.com") ||
        normalizedUrl.includes("x.com")
    ) {
        return "tweet";
    }

    if (
        normalizedUrl.endsWith(".pdf") ||
        normalizedType === "application/pdf" ||
        normalizedType.includes("pdf")
    ) {
        return "pdf";
    }

    if (normalizedType.includes("video")) {
        return "article";
    }
    // linkdin
    if (normalizedUrl.includes("linkedin.com")) {
        return "linkedin";
    }
    // instagram
    if (normalizedUrl.includes("instagram.com")) {
        return "instagram";
    }
    // github
    if (normalizedUrl.includes("github.com")) {
        return "github";
    }
    // x
    if (normalizedUrl.includes("x.com")) {
        return "x";
    }

    return "article";
}

function detectPlatform(url) {
    const normalizedUrl = (url || "").toLowerCase();

    if (
        normalizedUrl.includes("youtube.com") ||
        normalizedUrl.includes("youtu.be")
    ) {
        return "youtube";
    }

    if (
        normalizedUrl.includes("twitter.com") ||
        normalizedUrl.includes("x.com")
    ) {
        return "twitter";
    }

    if (normalizedUrl.includes("linkedin.com")) return "linkedin";
    if (normalizedUrl.includes("instagram.com")) return "instagram";
    return "web";
}

function platformFallbackImage(platform) {
    const images = {
        youtube: "https://www.youtube.com/img/desktop/yt_1200.png",
        twitter: "https://abs.twimg.com/icons/apple-touch-icon-192x192.png",
        linkedin: "https://static.licdn.com/scds/common/u/images/logos/favicons/v1/favicon.ico",
        instagram: "https://static.cdninstagram.com/rsrc.php/v3/yt/r/30PrGfR3xhB.png",
    };

    return images[platform] || "";
}

function extractBestTitle(result, sourceUrl, platform) {
    const jsonLdTitles = collectJsonLdTitles(result?.jsonLD);
    const titleCandidates = [
        ...(platform === "linkedin" ? jsonLdTitles : []),
        result?.ogTitle,
        result?.twitterTitle,
        ...(platform !== "linkedin" ? jsonLdTitles : []),
        extractFromUrl(sourceUrl),
    ];

    for (const candidate of titleCandidates) {
        const normalized = normalizeTitle(candidate);

        if (!normalized) {
            continue;
        }

        if (platform === "twitter" && isStatusId(normalized)) {
            continue;
        }

        return normalized;
    }

    if (platform === "twitter") {
        return buildTwitterFallbackTitle(sourceUrl);
    }

    if (platform === "linkedin") {
        return buildLinkedInFallbackTitle(sourceUrl);
    }

    return "No title";
}

function extractBestDescription(result) {
    const descriptionCandidates = [
        result?.ogDescription,
        result?.twitterDescription,
        ...collectJsonLdDescriptions(result?.jsonLD),
    ];

    for (const candidate of descriptionCandidates) {
        if (typeof candidate !== "string") {
            continue;
        }

        const normalized = candidate.trim();

        if (normalized) {
            return normalized;
        }
    }

    return "";
}

function extractBestImage(result, sourceUrl, platform) {
    const imageCandidates = [
        ...collectImageCandidates(result?.ogImage),
        ...collectImageCandidates(result?.twitterImage),
        ...collectImageCandidates(result?.ogImageSecureUrl),
        ...collectImageCandidates(result?.twitterImageSrc),
        ...collectImageCandidates(result?.image),
        ...collectImageCandidates(result?.images),
        ...collectJsonLdImages(result?.jsonLD),
        ...collectImageCandidates(result?.favicon),
    ];

    const image = uniqueValidUrls(imageCandidates, sourceUrl)[0];

    if (image) {
        return image;
    }

    return platformFallbackImage(platform) || "";
}

function collectImageCandidates(value) {
    if (!value) return [];

    if (typeof value === "string") {
        return [value];
    }

    if (Array.isArray(value)) {
        return value.flatMap(item => collectImageCandidates(item));
    }

    if (typeof value === "object") {
        return [
            value.url,
            value.secureUrl,
            value.src,
            value.image,
        ].filter(Boolean);
    }

    return [];
}

function collectJsonLdTitles(jsonLd) {
    if (!jsonLd) return [];

    const entries = Array.isArray(jsonLd) ? jsonLd : [jsonLd];

    return entries.flatMap(entry => {
        if (!entry || typeof entry !== "object") {
            return [];
        }

        return [
            entry.headline,
            entry.name,
            entry.alternativeHeadline,
        ].filter(Boolean);
    });
}

function collectJsonLdDescriptions(jsonLd) {
    if (!jsonLd) return [];

    const entries = Array.isArray(jsonLd) ? jsonLd : [jsonLd];

    return entries.flatMap(entry => {
        if (!entry || typeof entry !== "object") {
            return [];
        }

        return [
            entry.description,
            entry.articleBody,
        ].filter(Boolean);
    });
}

function collectJsonLdImages(jsonLd) {
    if (!jsonLd) return [];

    const entries = Array.isArray(jsonLd) ? jsonLd : [jsonLd];

    return entries.flatMap(entry => {
        if (!entry || typeof entry !== "object") {
            return [];
        }

        return collectImageCandidates(entry.image);
    });
}

function uniqueValidUrls(candidates, sourceUrl) {
    const seen = new Set();
    const valid = [];

    for (const candidate of candidates) {
        const normalized = normalizeUrl(candidate, sourceUrl);

        if (!normalized || seen.has(normalized)) {
            continue;
        }

        seen.add(normalized);
        valid.push(normalized);
    }

    return valid;
}

function normalizeUrl(candidate, sourceUrl) {
    if (!candidate || typeof candidate !== "string") {
        return "";
    }

    const trimmed = candidate.trim();

    if (!trimmed) {
        return "";
    }

    if (
        trimmed.startsWith("data:") ||
        trimmed.startsWith("javascript:")
    ) {
        return "";
    }

    try {
        const normalized = new URL(trimmed, sourceUrl).toString();

        if (isBlockedImageUrl(normalized)) {
            return "";
        }

        return normalized;
    } catch {
        return "";
    }
}

function isBlockedImageUrl(imageUrl) {
    try {
        const parsed = new URL(imageUrl);
        const pathname = parsed.pathname.toLowerCase();
        const hostname = parsed.hostname.toLowerCase();

        if (pathname.includes("/emoji/")) {
            return true;
        }

        if (pathname.includes("favicon") || pathname.endsWith(".ico")) {
            return true;
        }

        if (
            hostname.includes("twimg.com") &&
            pathname.includes("/emoji/")
        ) {
            return true;
        }

        return false;
    } catch {
        return true;
    }
}

function normalizeTitle(title) {
    if (!title || typeof title !== "string") {
        return "";
    }

    const cleaned = cleanTitle(title)
        .replace(/\s+/g, " ")
        .trim();

    return cleaned;
}

function isStatusId(value) {
    return /^\d{8,}$/.test(String(value || "").trim());
}

function buildTwitterFallbackTitle(sourceUrl) {
    try {
        const segments = new URL(sourceUrl).pathname
            .split("/")
            .filter(Boolean);

        const username = segments.find(
            segment => segment && segment.toLowerCase() !== "status"
        );

        if (username && username.toLowerCase() !== "i" && username.toLowerCase() !== "web") {
            return `Tweet by @${username}`;
        }
    } catch {
        return "Tweet";
    }

    return "Tweet";
}

function buildLinkedInFallbackTitle(sourceUrl) {
    try {
        const segments = new URL(sourceUrl).pathname
            .split("/")
            .filter(Boolean);

        if (segments[0] === "posts" && segments[1]) {
            return cleanTitle(segments[1].replace(/[-_]/g, " "));
        }
    } catch {
        return "LinkedIn post";
    }

    return "LinkedIn post";
}

function extractFromUrl(url) {
    try {
        const clean = new URL(url).pathname;
        return clean
            .split("/")
            .filter(Boolean)
            .pop()
            ?.replace(/[-_]/g, " ") || "";
    } catch {
        return "";
    }
}

function splitTags(str) {
    if (!str || typeof str !== "string") return [];

    return str
        .split(/[\s,]+/)
        .map(sanitizeTag)
        .filter(t => t.length > 2);
}

function generateTagsFromTitle(title) {
    return title
        .toLowerCase()
        .split(" ")
        .map(sanitizeTag)
        .filter(w => w.length > 3)
        .slice(0, 5);
}

function sanitizeTag(tag) {
    if (!tag || typeof tag !== "string") {
        return "";
    }

    return tag
        .toLowerCase()
        .replace(/^[^a-z0-9]+/i, "")
        .replace(/[^a-z0-9]+$/i, "")
        .trim();
}

function fallback(url, platform) {
    return {
        title: extractFromUrl(url) || "No title",
        description: "",
        image: platformFallbackImage(platform) || "",
        siteName: platform,
        type: mapType(url, null),
        url,
        tags: [platform],
    };
}
