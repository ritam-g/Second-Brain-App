import { generateUploadMetadataFromText } from "./ai.service.js"

const maxDescriptionCharacters = 180
const maxSavedTags = 10
const genericFileNamePatterns = [
    /^(img|image|photo|pic|scan|screenshot|document|file|upload)[-_ ]?\d+$/i,
    /^whatsapp[-_ ]image[-_ ]\d+/i,
    /^pxl[_-]\d+/i,
    /^dsc[_-]?\d+/i,
]
const blockedTags = new Set([
    "com",
    "corrupted",
    "email",
    "gmail",
    "garbled",
    "github",
    "illegible",
    "leetcode",
    "linkedin",
    "metadata",
    "ocr",
    "phone",
    "portfolio",
    "sample",
    "text",
    "unreadable",
])
const stopWords = new Set([
    "about",
    "after",
    "again",
    "also",
    "because",
    "being",
    "between",
    "content",
    "could",
    "document",
    "file",
    "from",
    "gmail",
    "github",
    "have",
    "image",
    "into",
    "just",
    "leetcode",
    "linkedin",
    "like",
    "more",
    "only",
    "other",
    "over",
    "portfolio",
    "saved",
    "that",
    "their",
    "there",
    "these",
    "this",
    "upload",
    "using",
    "with",
    "would",
])

// Resolves stable metadata for uploaded PDFs and images without trusting noisy OCR blindly.
// Input: object containing manual title, file name, file type, extracted text, and optional OCR confidence.
// Output: object with clean `title`, `description`, and `tags` ready to persist in MongoDB.
export async function resolveUploadMetadata({
    manualTitle,
    originalName,
    uploadType,
    extractedText,
    ocrConfidence,
}) {
    const normalizedManualTitle = polishTitle(normalizeSingleLine(manualTitle))
    const cleanedText = sanitizeExtractedText(extractedText)
    const extractedTitle = extractTitleCandidate(cleanedText)
    const textQuality = analyzeExtractedText(cleanedText, { uploadType, ocrConfidence })
    const fallbackTitle = normalizedManualTitle
        || extractedTitle
        || buildFileNameTitle(originalName, uploadType)
    const fallbackDescription = buildFallbackDescription({
        fallbackTitle,
        uploadType,
        cleanedText,
        textQuality,
    })
    const fallbackTags = buildFallbackTags({
        fallbackTitle,
        originalName,
        uploadType,
        cleanedText,
        textQuality,
    })

    let aiMetadata = null

    try {
        aiMetadata = await generateUploadMetadataFromText(textQuality.promptText, {
            fileName: originalName,
            fileType: uploadType,
            fallbackTitle,
            fallbackDescription,
            textReadable: textQuality.isReadable,
        })
    } catch (error) {
        console.error("Upload Metadata AI Error:", error.message)
    }

    return {
        title: normalizedManualTitle || resolveFinalTitle(aiMetadata?.title, fallbackTitle),
        description: resolveFinalDescription(aiMetadata?.description, fallbackDescription),
        tags: mergeTags(aiMetadata?.tags, fallbackTags),
    }
}

// Removes noisy OCR lines so title and description generation only use plausible text.
// Input: raw OCR/PDF text string.
// Output: cleaned multi-line text string with obvious garbage lines removed.
function sanitizeExtractedText(text) {
    return String(text || "")
        .replace(/\u0000/g, " ")
        .replace(/\r/g, "\n")
        .split("\n")
        .map(line => normalizeSingleLine(line))
        .filter(Boolean)
        .filter(line => !isNoiseLine(line))
        .slice(0, 24)
        .join("\n")
        .trim()
}

// Scores whether the extracted text is reliable enough for AI prompting and direct descriptions.
// Input: cleaned text plus the upload type and optional OCR confidence.
// Output: analysis object with readability flags, score, and AI-safe prompt text.
function analyzeExtractedText(text, { uploadType, ocrConfidence }) {
    const normalizedText = String(text || "").trim()
    const compactText = normalizedText.replace(/\s+/g, "")
    const words = normalizedText.match(/[a-z0-9]+/gi) || []
    const weirdSymbolRatio = compactText
        ? countMatches(normalizedText, /[\\/\[\]{}|_=~^<>]/g) / compactText.length
        : 1
    const longTokenRatio = words.length
        ? words.filter(word => word.length >= 18).length / words.length
        : 1
    const readableWordRatio = words.length
        ? words.filter(isReadableWord).length / words.length
        : 0
    const hasEnoughContent = normalizedText.length >= 48 || words.length >= 8

    let score = 0

    if (hasEnoughContent) {
        score += 2
    }

    if (readableWordRatio >= 0.6) {
        score += 2
    }

    if (weirdSymbolRatio <= 0.08) {
        score += 1
    }

    if (longTokenRatio <= 0.2) {
        score += 1
    }

    if (!Number.isFinite(ocrConfidence) || ocrConfidence >= 50) {
        score += 1
    }

    const isReadable = Boolean(normalizedText)
        && (
            score >= 5
            || (words.length >= 4 && readableWordRatio >= 0.75 && weirdSymbolRatio < 0.06)
        )

    return {
        isReadable,
        score,
        promptText: isReadable
            ? normalizedText.slice(0, 5000)
            : `No reliable OCR text extracted.\nFile type: ${uploadType}\nFallback title: ${buildDefaultTitle(uploadType)}`,
    }
}

// Detects OCR lines that are mostly symbols, fragments, or visually corrupted text.
// Input: one normalized line of OCR/PDF text.
// Output: boolean indicating whether the line should be discarded.
function isNoiseLine(line) {
    const normalizedLine = normalizeSingleLine(line)
    const compactLine = normalizedLine.replace(/\s+/g, "")

    if (compactLine.length < 2) {
        return true
    }

    const alphaNumericRatio = countMatches(normalizedLine, /[a-z0-9]/gi) / compactLine.length
    const weirdSymbolRatio = countMatches(normalizedLine, /[\\/\[\]{}|_=~^<>]/g) / compactLine.length
    const words = normalizedLine.split(/\s+/).filter(Boolean)
    const longTokenRatio = words.length
        ? words.filter(word => word.length >= 18).length / words.length
        : 1

    if (alphaNumericRatio < 0.45) {
        return true
    }

    if (weirdSymbolRatio > 0.12) {
        return true
    }

    if (longTokenRatio > 0.4) {
        return true
    }

    if (!/[aeiou]/i.test(normalizedLine) && compactLine.length > 14 && !/\d/.test(normalizedLine)) {
        return true
    }

    return false
}

// Extracts the first plausible title candidate from cleaned OCR/PDF text.
// Input: cleaned multi-line extracted text.
// Output: short title string or an empty string when no good title line exists.
function extractTitleCandidate(text) {
    const lines = String(text || "")
        .split("\n")
        .map(line => normalizeSingleLine(line))
        .filter(Boolean)

    const titleLine = lines.find(line => {
        const wordCount = line.split(/\s+/).filter(Boolean).length

        return line.length >= 3
            && line.length <= 90
            && !looksLikeHashtagWall(line)
            && !looksLikeContactLine(line)
            && wordCount <= 10
            && !isNoiseLine(line)
    })

    return titleLine ? polishTitle(titleLine.slice(0, 80)) : ""
}

// Builds a readable title from the uploaded file name when OCR text is missing or unreliable.
// Input: original file name and detected upload type.
// Output: human-friendly title string.
function buildFileNameTitle(originalName, uploadType) {
    const baseName = stripFileExtension(originalName)
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()

    if (!baseName || genericFileNamePatterns.some(pattern => pattern.test(baseName))) {
        return buildDefaultTitle(uploadType)
    }

    return toTitleCase(baseName).slice(0, 80)
}

// Provides a safe generic title when neither OCR text nor filename are descriptive.
// Input: detected upload type.
// Output: generic image/document title string.
function buildDefaultTitle(uploadType) {
    return uploadType === "image" ? "Uploaded Image" : "Uploaded PDF"
}

// Builds a short readable description without exposing corrupted OCR text.
// Input: resolved fallback title, upload type, cleaned text, and text quality analysis.
// Output: user-facing description string capped for card previews.
function buildFallbackDescription({ fallbackTitle, uploadType, cleanedText, textQuality }) {
    if (textQuality.isReadable) {
        return buildDescriptionSnippet(cleanedText, fallbackTitle)
    }

    if (uploadType === "image") {
        return isGenericTitle(fallbackTitle, uploadType)
            ? "Uploaded image saved to Second Brain."
            : `${fallbackTitle} saved to Second Brain.`
    }

    return isGenericTitle(fallbackTitle, uploadType)
        ? "Uploaded PDF saved to Second Brain. Open the file to view the full document."
        : `${fallbackTitle} saved to Second Brain. Open the file to view the full document.`
}

// Converts readable extracted text into a concise one-line description.
// Input: cleaned OCR/PDF text string and the resolved title.
// Output: short description string suitable for dashboard cards.
function buildDescriptionSnippet(text, fallbackTitle) {
    const normalizedText = buildReadableSummaryText(text, fallbackTitle)
    const normalizedTitle = normalizeSingleLine(fallbackTitle)

    if (!normalizedText) {
        return `${fallbackTitle} saved to Second Brain. Open the file to view the full document.`
    }

    if (normalizedTitle && normalizedText.toLowerCase().startsWith(normalizedTitle.toLowerCase())) {
        const remainder = normalizeSingleLine(
            normalizedText
                .slice(normalizedTitle.length)
                .replace(/^[-:|,.\s]+/, ""),
        )

        if (remainder.length >= 24) {
            return remainder.slice(0, maxDescriptionCharacters)
        }
    }

    return normalizedText.slice(0, maxDescriptionCharacters)
}

// Builds fallback searchable tags from the title, file name, type, and only readable text fragments.
// Input: resolved title, original file name, upload type, cleaned text, and text quality analysis.
// Output: normalized array of tags capped for MongoDB storage.
function buildFallbackTags({ fallbackTitle, originalName, uploadType, cleanedText, textQuality }) {
    const summaryText = buildReadableSummaryText(cleanedText, fallbackTitle)
    const candidates = [
        uploadType,
        "upload",
        ...extractKeywords(fallbackTitle),
        ...extractKeywords(stripFileExtension(originalName)),
    ]

    if (textQuality.isReadable) {
        candidates.push(...extractKeywords(summaryText))
    }

    return normalizeTags(candidates)
}

// Resolves the final persisted title while rejecting AI output that still looks corrupted.
// Input: AI-generated title and a deterministic fallback title.
// Output: clean title string safe to save in MongoDB.
function resolveFinalTitle(aiTitle, fallbackTitle) {
    const normalizedAiTitle = normalizeSingleLine(aiTitle)

    if (
        !normalizedAiTitle
        || looksUnreadable(normalizedAiTitle)
        || looksLikeHashtagWall(normalizedAiTitle)
        || looksLikeContactLine(normalizedAiTitle)
    ) {
        return fallbackTitle
    }

    return polishTitle(normalizedAiTitle.slice(0, 80))
}

// Resolves the final persisted description while rejecting noisy or overlong AI output.
// Input: AI-generated description and a deterministic fallback description.
// Output: clean description string safe to save in MongoDB.
function resolveFinalDescription(aiDescription, fallbackDescription) {
    const normalizedAiDescription = normalizeSingleLine(aiDescription)

    if (
        !normalizedAiDescription
        || looksUnreadable(normalizedAiDescription)
        || looksLikeHashtagWall(normalizedAiDescription)
        || looksLikeContactLine(normalizedAiDescription)
        || /no reliable ocr text/i.test(normalizedAiDescription)
    ) {
        return fallbackDescription
    }

    return normalizedAiDescription.slice(0, maxDescriptionCharacters)
}

// Merges AI tags with fallback tags while removing noisy OCR-related tokens.
// Input: AI-generated tag array and fallback tag array.
// Output: deduplicated tag array capped for MongoDB storage.
function mergeTags(aiTags, fallbackTags) {
    return normalizeTags([
        ...(Array.isArray(aiTags) ? aiTags : []),
        ...(Array.isArray(fallbackTags) ? fallbackTags : []),
    ])
}

// Extracts meaningful keywords from text without preserving OCR garbage or filler words.
// Input: free-form text value such as title, file name, or cleaned extracted text.
// Output: array of keyword candidates.
function extractKeywords(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/[\s-]+/)
        .filter(word => word.length > 2 && !stopWords.has(word))
        .slice(0, 8)
}

// Normalizes and filters raw tags before storing them in MongoDB.
// Input: raw tag array.
// Output: lowercase, deduplicated, filtered tag array.
function normalizeTags(tags) {
    const normalizedTags = tags
        .map(sanitizeTag)
        .filter(Boolean)
        .filter(tag => !/^\d+$/.test(tag))
        .filter(tag => !blockedTags.has(tag))

    return [...new Set(normalizedTags)].slice(0, maxSavedTags)
}

// Sanitizes a single raw tag into a searchable lowercase token.
// Input: raw tag string.
// Output: cleaned tag string or an empty string when invalid.
function sanitizeTag(tag) {
    return String(tag || "")
        .toLowerCase()
        .trim()
        .replace(/^#+/, "")
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
}

// Detects metadata strings that still look like OCR corruption.
// Input: generated title or description string.
// Output: boolean indicating whether the text should be rejected.
function looksUnreadable(value) {
    const normalizedValue = normalizeSingleLine(value)
    const compactValue = normalizedValue.replace(/\s+/g, "")

    if (!compactValue) {
        return true
    }

    const weirdSymbolRatio = countMatches(normalizedValue, /[\\/\[\]{}|_=~^<>]/g) / compactValue.length
    const words = normalizedValue.match(/[a-z0-9]+/gi) || []
    const readableWordRatio = words.length
        ? words.filter(isReadableWord).length / words.length
        : 0

    return weirdSymbolRatio > 0.1 || (words.length >= 3 && readableWordRatio < 0.45)
}

// Determines whether a title is just the generic fallback for the detected file type.
// Input: title string and upload type string.
// Output: boolean indicating whether the title is generic.
function isGenericTitle(title, uploadType) {
    return normalizeSingleLine(title).toLowerCase() === buildDefaultTitle(uploadType).toLowerCase()
}

// Checks whether a token looks like a normal readable word instead of OCR corruption.
// Input: single lowercase or mixed-case token.
// Output: boolean indicating whether the token looks readable.
function isReadableWord(word) {
    const normalizedWord = String(word || "").toLowerCase()

    if (normalizedWord.length < 2 || normalizedWord.length > 16) {
        return false
    }

    if (/^\d+$/.test(normalizedWord)) {
        return true
    }

    return /[aeiou]/.test(normalizedWord) || /[a-z]{3,}/.test(normalizedWord)
}

// Counts regex matches inside a string for readability heuristics.
// Input: string value and global regex pattern.
// Output: integer match count.
function countMatches(value, pattern) {
    return (String(value || "").match(pattern) || []).length
}

// Normalizes free-form user-facing strings to a compact single line.
// Input: raw text value.
// Output: trimmed single-line string.
function normalizeSingleLine(value) {
    return String(value || "")
        .replace(/\s+/g, " ")
        .trim()
}

// Builds a summary line from readable OCR/PDF text while removing contact blocks and hashtag walls.
// Input: cleaned extracted text and the resolved title.
// Output: compact summary string safe for card descriptions.
function buildReadableSummaryText(text, fallbackTitle) {
    const normalizedTitle = normalizeSingleLine(fallbackTitle).toLowerCase()
    const summaryLines = String(text || "")
        .split("\n")
        .map(line => stripLeadingHashtagWall(line))
        .map(removeContactFragments)
        .map(line => normalizeSingleLine(line))
        .filter(Boolean)
        .filter(line => !isNoiseLine(line))
        .filter(line => !looksLikeHashtagWall(line))
        .filter(line => !looksLikeContactLine(line))
        .filter(line => {
            const wordCount = line.split(/\s+/).filter(Boolean).length
            return wordCount >= 3 || line.length >= 24
        })
        .map(line => {
            if (!normalizedTitle) {
                return line
            }

            if (line.toLowerCase() === normalizedTitle) {
                return ""
            }

            if (line.toLowerCase().startsWith(normalizedTitle)) {
                return normalizeSingleLine(line.slice(normalizedTitle.length).replace(/^(\s|:|\||,|\.|-)+/, ""))
            }

            return line
        })
        .filter(Boolean)

    return summaryLines.join(" ").slice(0, maxDescriptionCharacters)
}

// Removes the final file extension so filenames can become titles and tags.
// Input: original file name string.
// Output: file name without the last extension.
function stripFileExtension(fileName) {
    return String(fileName || "").trim().replace(/\.[^.]+$/, "")
}

// Converts file-name-like text into readable title case without breaking existing acronyms badly.
// Input: raw filename-derived title string.
// Output: humanized title-cased string.
function toTitleCase(value) {
    return String(value || "")
        .split(" ")
        .filter(Boolean)
        .map(word => {
            if (/^[A-Z0-9]{2,}$/.test(word)) {
                return word
            }

            const lowerCasedWord = word.toLowerCase()
            return lowerCasedWord.charAt(0).toUpperCase() + lowerCasedWord.slice(1)
        })
        .join(" ")
}

// Polishes saved titles so lower-case manual or OCR-derived titles render like intentional metadata.
// Input: normalized title string.
// Output: title-cased string when the source title is entirely lowercase.
function polishTitle(value) {
    const normalizedValue = normalizeSingleLine(value)

    if (!normalizedValue) {
        return ""
    }

    if (normalizedValue === normalizedValue.toLowerCase()) {
        return toTitleCase(normalizedValue)
    }

    return normalizedValue
}

// Detects strings that are mostly hashtag lists instead of readable titles or summaries.
// Input: free-form title or description string.
// Output: boolean indicating whether the text is hashtag-heavy.
function looksLikeHashtagWall(value) {
    const normalizedValue = normalizeSingleLine(value)
    const hashtags = normalizedValue.match(/#[a-z0-9][a-z0-9-]*/gi) || []
    const words = normalizedValue.match(/[a-z0-9]+/gi) || []

    return hashtags.length >= 3 && hashtags.length >= Math.ceil(words.length * 0.4)
}

// Detects contact-heavy OCR lines so they do not become saved titles or summaries.
// Input: one normalized metadata string.
// Output: boolean indicating whether the line is mostly contact info.
function looksLikeContactLine(value) {
    const normalizedValue = String(value || "")

    return /\b\S+@\S+\.\S+\b/.test(normalizedValue)
        || /\+?\d[\d\s().-]{7,}\d/.test(normalizedValue)
        || /\b(?:linkedin|github|portfolio|leetcode|https?:\/\/|www\.)\b/i.test(normalizedValue)
}

// Removes leading hashtag walls from OCR/PDF text before titles and descriptions are derived.
// Input: raw OCR/PDF line string.
// Output: cleaned line string.
function stripLeadingHashtagWall(value) {
    return String(value || "")
        .replace(/^(?:#[a-z0-9][a-z0-9-]*\s*){3,}/gi, "")
        .trim()
}

// Removes contact fragments from OCR/PDF lines so descriptions stay readable.
// Input: raw OCR/PDF line string.
// Output: cleaned line string with contact tokens removed.
function removeContactFragments(value) {
    return String(value || "")
        .replace(/\b\S+@\S+\.\S+\b/gi, " ")
        .replace(/\+?\d[\d\s().-]{7,}\d/g, " ")
        .replace(/\b(?:linkedin|github|portfolio|leetcode)\b/gi, " ")
        .replace(/\bhttps?:\/\/\S+/gi, " ")
        .replace(/\bwww\.\S+/gi, " ")
        .replace(/[|]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
}
