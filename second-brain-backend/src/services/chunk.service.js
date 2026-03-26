import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"

const defaultChunkSize = 1000
const defaultChunkOverlap = 150
const maxChunkCount = 500
const maxChunkableCharacters = 250000

// Splits extracted document text into overlapping chunks safe for embedding and retrieval.
// Input: raw extracted text string.
// Output: normalized chunk array capped to a safe upper bound.
export async function splitText(text) {
    const normalizedText = normalizeText(text)

    if (!normalizedText) {
        return []
    }

    const chunkSize = resolvePositiveInteger(process.env.TEXT_CHUNK_SIZE, defaultChunkSize)
    const chunkOverlap = Math.min(
        resolvePositiveInteger(process.env.TEXT_CHUNK_OVERLAP, defaultChunkOverlap),
        Math.max(0, chunkSize - 1),
    )
    const maxCharacters = resolvePositiveInteger(process.env.TEXT_CHUNK_MAX_CHARACTERS, maxChunkableCharacters)
    const maxChunks = resolvePositiveInteger(process.env.TEXT_CHUNK_MAX_COUNT, maxChunkCount)
    const safeText = normalizedText.slice(0, maxCharacters)
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
        separators: ["\n\n", "\n", ". ", " ", ""],
    })
    const chunks = await splitter.splitText(safeText)

    return chunks
        .map(chunk => chunk.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .slice(0, maxChunks)
}

// Normalizes extracted text before it is chunked.
// Input: raw OCR/PDF text.
// Output: cleaned text string.
function normalizeText(text) {
    return String(text || "")
        .replace(/\u0000/g, " ")
        .replace(/\r/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
}

// Resolves chunking config values from env while keeping sane defaults.
// Input: env string value and fallback number.
// Output: positive integer.
function resolvePositiveInteger(value, fallback) {
    const numericValue = Number(value)

    if (!Number.isInteger(numericValue) || numericValue <= 0) {
        return fallback
    }

    return numericValue
}
