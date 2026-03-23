import ogs from "open-graph-scraper";

export async function getMetadata(url) {
    try {
        const { error, result } = await ogs({ url });

        const platform = detectPlatform(url);
        console.log(result);

        if (error || !result) {
            return fallback(url, platform);
        }

        // ✅ TITLE
        const title =
            result.ogTitle ||
            result.twitterTitle ||
            extractFromUrl(url) ||
            "No title";

        // ✅ DESCRIPTION
        const description =
            result.ogDescription ||
            result.twitterDescription ||
            "";

        // ✅ IMAGE (very important fallback)
        const image =
            result.ogImage?.[0]?.url ||
            result.twitterImage?.[0]?.url ||
            platformFallbackImage(platform);

        // ✅ TAGS (multi-source)
        let tags = [];

        if (result.ogVideoTag) {
            tags.push(...splitTags(result.ogVideoTag));
        }

        if (result.keywords) {
            tags.push(...splitTags(result.keywords));
        }

        tags.push(...generateTagsFromTitle(title));
        tags.push(platform); // include platform as tag

        tags = [...new Set(tags)];

        return {
            title,
            description,
            image,
            siteName: result.ogSiteName || platform,
            type: result.ogType || "article",
            url: result.ogUrl || url,
            tags,
        };

    } catch (err) {
        console.error("Metadata Error:", err.message);
        return fallback(url, detectPlatform(url));
    }
}

// 🔹 Detect platform
function detectPlatform(url) {
    if (url.includes("youtube")) return "youtube";
    if (url.includes("twitter") || url.includes("x.com")) return "twitter";
    if (url.includes("linkedin")) return "linkedin";
    if (url.includes("instagram")) return "instagram";
    return "web";
}

// 🔹 Fallback image per platform
function platformFallbackImage(platform) {
    const images = {
        youtube: "https://www.youtube.com/img/desktop/yt_1200.png",
        twitter: "https://abs.twimg.com/icons/apple-touch-icon-192x192.png",
        linkedin: "https://static.licdn.com/scds/common/u/images/logos/favicons/v1/favicon.ico",
        instagram: "https://static.cdninstagram.com/rsrc.php/v3/yt/r/30PrGfR3xhB.png",
    };

    return images[platform] || "";
}

// 🔹 Extract title from URL (fallback)
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

// 🔹 Split tags
function splitTags(str) {
    return str
        .split(/[\s,]+/)
        .map(t => t.toLowerCase().trim())
        .filter(t => t.length > 2);
}

// 🔹 Generate tags from title
function generateTagsFromTitle(title) {
    return title
        .toLowerCase()
        .split(" ")
        .filter(w => w.length > 3)
        .slice(0, 5);
}

// 🔹 fallback
function fallback(url, platform) {
    return {
        title: extractFromUrl(url) || "No title",
        description: "",
        image: platformFallbackImage(platform),
        siteName: platform,
        type: "article",
        url,
        tags: [platform],
    };
}