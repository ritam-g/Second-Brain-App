import { YoutubeTranscript } from "youtube-transcript/dist/youtube-transcript.esm.js"
import { generateYouTubeEnglishDescription } from "./ai.service.js"
import { getYouTubeMetadata } from "./metadata/youtube-metadata.service.js"
import { normalizeDescription, normalizeTitle } from "./metadata/metadata.shared.js"
import {
    buildYouTubeThumbnail,
    extractYouTubeId,
    normalizeYouTubeUrl,
} from "../utils/youtube.util.js"

const noiseTranscriptPattern = /^\[(?:music|applause|laughter|cheering|silence|foreign|captions?)\]$/i
const timestampPattern = /\b\d{1,2}:\d{2}(?::\d{2})?\b/g
// Enriches the basic YouTube metadata with transcript-aware text so saved videos behave like searchable documents.
// Input: original YouTube URL plus optional test hooks for metadata and transcript generation.
// Output: metadata object containing description, transcript text, and retrieval-ready index text.
export async function getYouTubeContentMetadata(url, {
    metadata: providedMetadata,
    fetchTranscript = fetchYouTubeTranscriptText,
    generateEnglishDescription = generateYouTubeEnglishDescription,
} = {}) {
    const baseMetadata = await resolveBaseYouTubeMetadata(url, providedMetadata)
    const transcriptText = await resolveTranscriptText(baseMetadata.videoId, fetchTranscript)
    const description = await resolveEnglishDescription({
        url: baseMetadata.url,
        title: baseMetadata.title,
        channelName: baseMetadata.authorName,
        transcriptText,
        generateEnglishDescription,
    })
    const indexText = buildYouTubeIndexText({
        title: baseMetadata.title,
        channelName: baseMetadata.authorName,
        description,
        transcriptText,
        tags: baseMetadata.tags,
        url: baseMetadata.url,
    })

    return {
        ...baseMetadata,
        description,
        descriptionLanguage: "en",
        transcriptText,
        indexText,
        transcriptAvailable: Boolean(transcriptText),
    }
}

async function resolveBaseYouTubeMetadata(url, providedMetadata) {
    try {
        const resolvedMetadata = providedMetadata || await getYouTubeMetadata(url)
        const videoId = String(resolvedMetadata?.videoId || extractYouTubeId(url)).trim()
        const canonicalUrl = normalizeYouTubeUrl(resolvedMetadata?.url || url)
        const title = normalizeTitle(resolvedMetadata?.title) || "YouTube Video"
        const authorName = normalizeTitle(resolvedMetadata?.authorName)
        const image = String(resolvedMetadata?.image || "").trim()
            || buildYouTubeThumbnail(videoId)

        return {
            ...resolvedMetadata,
            title,
            authorName,
            image,
            url: canonicalUrl || String(resolvedMetadata?.url || url).trim(),
            type: "youtube",
            siteName: "youtube",
            tags: Array.from(new Set([
                ...(Array.isArray(resolvedMetadata?.tags) ? resolvedMetadata.tags : []),
                "youtube",
            ].filter(Boolean))),
            videoId,
        }
    } catch (error) {
        console.error("YouTube Metadata Resolve Error:", error.message)

        const videoId = extractYouTubeId(url)
        return {
            title: "YouTube Video",
            description: "",
            image: buildYouTubeThumbnail(videoId),
            authorName: "",
            siteName: "youtube",
            type: "youtube",
            url: normalizeYouTubeUrl(url) || String(url || "").trim(),
            tags: ["youtube"],
            videoId,
        }
    }
}

async function resolveTranscriptText(videoId, fetchTranscript) {
    if (!videoId) {
        return ""
    }

    try {
        const transcriptText = await fetchTranscript(videoId)
        return normalizeTranscriptText(transcriptText)
    } catch (error) {
        console.error("YouTube Transcript Error:", error.message)
        return ""
    }
}

// Fetches the full YouTube transcript and flattens the caption segments into one clean text body.
// Input: YouTube video id string.
// Output: cleaned transcript text or an empty string when no captions are available.
export async function fetchYouTubeTranscriptText(videoId) {
    const transcriptSegments = await YoutubeTranscript.fetchTranscript(videoId)

    if (!Array.isArray(transcriptSegments) || !transcriptSegments.length) {
        return ""
    }

    const cleanedSegments = []
    let previousSegment = ""

    transcriptSegments.forEach((segment) => {
        const normalizedSegment = normalizeTranscriptSegment(segment?.text)

        if (!normalizedSegment || normalizedSegment.toLowerCase() === previousSegment) {
            return
        }

        cleanedSegments.push(normalizedSegment)
        previousSegment = normalizedSegment.toLowerCase()
    })

    return cleanedSegments.join(" ")
}

async function resolveEnglishDescription({
    url,
    title,
    channelName,
    transcriptText,
    generateEnglishDescription,
}) {
    try {
        const aiDescription = await generateEnglishDescription({
            url,
            title,
            channelName,
            transcriptText,
        })
        const normalizedAiDescription = normalizeDescription(aiDescription)

        if (normalizedAiDescription) {
            return normalizedAiDescription
        }
    } catch (error) {
        console.error("YouTube Fallback Description Error:", error.message)
    }

    return buildDeterministicDescription({ title, channelName })
}

function buildDeterministicDescription({ title, channelName }) {
    const normalizedTitle = normalizeTitle(title) || "YouTube video"
    const normalizedChannel = normalizeTitle(channelName)

    if (normalizedChannel) {
        return normalizeDescription(`${normalizedTitle} from ${normalizedChannel} saved from YouTube for later review.`)
    }

    return normalizeDescription(`${normalizedTitle} saved from YouTube for later review.`)
}

function buildYouTubeIndexText({ title, channelName, description, transcriptText, tags, url }) {
    return normalizeTextBlock([
        title ? `Title: ${title}` : "",
        channelName ? `Channel: ${channelName}` : "",
        description ? `Description: ${description}` : "",
        Array.isArray(tags) && tags.length ? `Tags: ${tags.join(", ")}` : "",
        url ? `Source URL: ${url}` : "",
        transcriptText ? `Transcript: ${transcriptText}` : "",
    ].filter(Boolean).join("\n\n"))
}

function normalizeTranscriptText(value) {
    return normalizeTextBlock(String(value || "")
        .replace(timestampPattern, " ")
        .replace(/\[(?:[^\]]{1,24})\]/g, (match) => (noiseTranscriptPattern.test(match) ? " " : match))
    )
}

function normalizeTranscriptSegment(value) {
    const normalizedValue = normalizeTextBlock(String(value || "")
        .replace(timestampPattern, " ")
    )

    if (!normalizedValue || noiseTranscriptPattern.test(normalizedValue)) {
        return ""
    }

    return normalizedValue
}

function normalizeTextBlock(value) {
    return String(value || "")
        .replace(/\u0000/g, " ")
        .replace(/\r/g, "\n")
        .replace(/\s+/g, " ")
        .trim()
}
