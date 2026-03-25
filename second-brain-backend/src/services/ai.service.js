import { ChatMistralAI } from "@langchain/mistralai"

const maxPromptCharacters = 6000
const maxGeneratedTags = 10
const stopWords = new Set([
    "about",
    "after",
    "again",
    "also",
    "because",
    "being",
    "between",
    "could",
    "document",
    "from",
    "have",
    "image",
    "into",
    "just",
    "like",
    "more",
    "only",
    "other",
    "over",
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

let mistralModel = null

// Generates 5-10 relevant tags from extracted content using LangChain + Mistral.
// Input: extracted text string and optional metadata such as file name and file type.
// Output: normalized array of tags ready to store in MongoDB.
export async function generateTagsFromText(text, context = {}) {
    const model = getMistralModel()
    const fallbackTags = buildFallbackTags(text, context)
    const promptText = buildPromptText(text, context)

    const response = await model.invoke([
        [
            "system",
            "Extract 5-10 relevant tags from this content. Return ONLY a JSON array of tags.",
        ],
        ["human", promptText],
    ])

    const parsedTags = parseTagArray(normalizeModelContent(response?.content))

    if (!parsedTags.length) {
        return fallbackTags
    }

    return mergeTags(parsedTags, fallbackTags)
}

// Lazily creates the Mistral chat model so missing AI credentials do not break unrelated routes.
// Input: none.
// Output: configured ChatMistralAI instance.
function getMistralModel() {
    if (mistralModel) {
        return mistralModel
    }

    const apiKey = String(process.env.MISTRAL_API_KEY || "").trim()

    if (!apiKey) {
        throw new Error("MISTRAL_API_KEY is not configured")
    }

    mistralModel = new ChatMistralAI({
        apiKey,
        model: process.env.MISTRAL_MODEL || "mistral-small-latest",
        temperature: 0,
        maxRetries: 2,
    })

    return mistralModel
}

// Builds a compact prompt so the AI sees the file context plus the most relevant extracted text.
// Input: extracted text string and metadata object.
// Output: prompt string to send to the chat model.
function buildPromptText(text, context) {
    const normalizedText = String(text || "").trim()
    const clippedText = normalizedText.slice(0, maxPromptCharacters) || "No readable text was extracted from the file."

    return [
        `File name: ${context?.fileName || "unknown"}`,
        `File type: ${context?.fileType || "document"}`,
        "Content:",
        clippedText,
    ].join("\n\n")
}

// Normalizes the model output into a plain string for JSON parsing.
// Input: LangChain response content which may be a string or content block array.
// Output: flattened text string.
function normalizeModelContent(content) {
    if (typeof content === "string") {
        return content
    }

    if (Array.isArray(content)) {
        return content
            .map(part => {
                if (typeof part === "string") {
                    return part
                }

                if (typeof part?.text === "string") {
                    return part.text
                }

                return ""
            })
            .join("\n")
    }

    return ""
}

// Parses the Mistral response into a raw array of candidate tags.
// Input: model response text that should contain a JSON array.
// Output: array of string tags or an empty array when parsing fails.
function parseTagArray(content) {
    const cleanContent = String(content || "")
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim()

    const directResult = safeParseArray(cleanContent)
    if (directResult.length) {
        return directResult
    }

    const bracketMatch = cleanContent.match(/\[[\s\S]*\]/)

    if (!bracketMatch) {
        return []
    }

    return safeParseArray(bracketMatch[0])
}

// Safely parses JSON text and keeps only string array values.
// Input: JSON string that should represent an array.
// Output: array of strings or an empty array if parsing fails.
function safeParseArray(value) {
    try {
        const parsed = JSON.parse(value)

        if (!Array.isArray(parsed)) {
            return []
        }

        return parsed.filter(item => typeof item === "string")
    } catch {
        return []
    }
}

// Builds deterministic fallback tags from the text and file metadata.
// Input: extracted text string and metadata object.
// Output: normalized array of fallback tags.
function buildFallbackTags(text, context) {
    const candidates = [
        context?.fileType,
        "upload",
        ...extractKeywords(String(context?.fileName || "")),
        ...extractKeywords(text),
    ]

    return normalizeTags(candidates)
}

// Merges AI tags with fallback tags so saved content always keeps file-type context.
// Input: AI-generated tags and fallback tags.
// Output: deduplicated tag array capped at 10 entries.
function mergeTags(aiTags, fallbackTags) {
    return normalizeTags([
        ...aiTags,
        ...fallbackTags,
    ])
}

// Converts raw candidate tokens into clean searchable tags.
// Input: array of raw tag strings.
// Output: lowercase, deduplicated tags with a maximum length.
function normalizeTags(tags) {
    const normalizedTags = tags
        .map(sanitizeTag)
        .filter(Boolean)

    return [...new Set(normalizedTags)].slice(0, maxGeneratedTags)
}

// Extracts meaningful keywords from file names and text without relying on the AI.
// Input: free-form text value.
// Output: array of keyword candidates.
function extractKeywords(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/[\s-]+/)
        .filter(word => word.length > 2 && !stopWords.has(word))
        .slice(0, 8)
}

// Sanitizes a single tag so MongoDB stores consistent values.
// Input: raw tag string.
// Output: cleaned lowercase tag or an empty string.
function sanitizeTag(tag) {
    return String(tag || "")
        .toLowerCase()
        .trim()
        .replace(/^#+/, "")
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
}
