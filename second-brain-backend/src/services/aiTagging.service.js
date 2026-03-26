import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { z } from "zod"
import { getMistralModel } from "./ai.service.js"

const maxPromptCharacters = 5000
const maxSavedTags = 8
const minimumTaggableCharacters = 20
const defaultStructuredTags = {
    category: "General",
    subCategory: "Misc",
    tags: ["general"],
}

// Structured schema for hierarchical AI tagging.
// This keeps the model output predictable before we normalize it for MongoDB.
export const taggingSchema = z.object({
    category: z.string(),
    subCategory: z.string(),
    tags: z.array(z.string()),
})

// Generates structured hierarchical tags from extracted content using Mistral + LangChain parsing.
// Input: extracted OCR/PDF text string.
// Output: object with `category`, `subCategory`, and normalized `tags`.
export async function generateStructuredTags(text) {
    const normalizedText = normalizeTaggingText(text)

    // Skip the model call when the extracted text is empty or too weak to classify reliably.
    if (normalizedText.length < minimumTaggableCharacters) {
        return { ...defaultStructuredTags }
    }

    try {
        const parser = StructuredOutputParser.fromZodSchema(taggingSchema)
        const model = getMistralModel()
        const response = await model.invoke([
            [
                "system",
                "You classify uploaded knowledge artifacts. Return ONLY valid JSON. Do not include markdown, explanations, prefixes, or suffixes. The JSON must contain exactly: category, subCategory, and tags.",
            ],
            ["human", buildStructuredTaggingPrompt(normalizedText, parser.getFormatInstructions())],
        ])
        const parsed = await parser.parse(normalizeModelContent(response?.content))

        return sanitizeStructuredTags(parsed)
    } catch (error) {
        console.error("Structured Tagging Error:", error.message)
        return { ...defaultStructuredTags }
    }
}

// Builds a strict prompt so the model classifies the content and adheres to the parser schema.
// Input: cleaned extracted text plus parser format instructions.
// Output: prompt string to send to Mistral.
function buildStructuredTaggingPrompt(text, formatInstructions) {
    return [
        "Analyze the uploaded content and classify it for a knowledge base.",
        "Rules:",
        "- category must be a broad domain such as Technology, Finance, Health, Education, Legal, Design, Marketing, or Business.",
        "- subCategory must be a more specific branch inside the chosen category.",
        "- tags must contain 3 to 8 concise, reusable keywords.",
        "- tags should be lowercase and should avoid duplicates.",
        "- return JSON only.",
        "",
        formatInstructions,
        "",
        "Content:",
        text.slice(0, maxPromptCharacters),
    ].join("\n")
}

// Normalizes extracted text before it is sent to the model.
// Input: raw OCR/PDF text.
// Output: compact single-string text block.
function normalizeTaggingText(text) {
    return String(text || "")
        .replace(/\u0000/g, " ")
        .replace(/\r/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
}

// Flattens LangChain model output into a plain string before the structured parser runs.
// Input: LangChain response content which may be a string or content-block array.
// Output: single text string.
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

// Cleans the parsed AI output so category fields stay readable and tags stay searchable.
// Input: parsed object from the structured output parser.
// Output: normalized hierarchical tagging object safe for MongoDB storage.
function sanitizeStructuredTags(value) {
    const category = normalizeLabel(value?.category, 60)
    const subCategory = normalizeLabel(value?.subCategory, 80)
    const tags = normalizeTags(value?.tags)

    if (!category || !subCategory || !tags.length) {
        return { ...defaultStructuredTags }
    }

    return {
        category,
        subCategory,
        tags,
    }
}

// Normalizes category-like labels to readable title case.
// Input: raw category or subCategory string.
// Output: cleaned label string.
function normalizeLabel(value, maxLength) {
    const normalizedValue = String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^["']+|["']+$/g, "")
        .slice(0, maxLength)

    if (!normalizedValue) {
        return ""
    }

    return normalizedValue
        .split(" ")
        .filter(Boolean)
        .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
        .join(" ")
}

// Normalizes tag arrays into lowercase searchable tokens with a bounded size.
// Input: raw parsed tag array.
// Output: deduplicated tag list safe to save in MongoDB.
function normalizeTags(tags) {
    if (!Array.isArray(tags)) {
        return []
    }

    const normalizedTags = tags
        .map(tag => String(tag || "")
            .toLowerCase()
            .trim()
            .replace(/^#+/, "")
            .replace(/[^a-z0-9-]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, ""))
        .filter(Boolean)

    return [...new Set(normalizedTags)].slice(0, maxSavedTags)
}
