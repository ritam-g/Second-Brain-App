import { PDFParse } from "pdf-parse"
import { createWorker } from "tesseract.js"

const pdfMimeTypes = new Set([
    "application/pdf",
])

const imageMimeTypes = new Set([
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/tiff",
    "image/tif",
])

const imageExtensions = new Set([
    "png",
    "jpg",
    "jpeg",
    "webp",
    "gif",
    "bmp",
    "tif",
    "tiff",
])

// Detects whether an uploaded file is a supported PDF or image.
// Input: multer file object with `mimetype` and `originalname`.
// Output: `"pdf"`, `"image"`, or `null` when the file is unsupported.
export function detectUploadFileType(file) {
    const mimeType = String(file?.mimetype || "").toLowerCase()
    const extension = getFileExtension(file?.originalname)

    if (pdfMimeTypes.has(mimeType) || extension === "pdf") {
        return "pdf"
    }

    if (imageMimeTypes.has(mimeType) || imageExtensions.has(extension)) {
        return "image"
    }

    return null
}

// Extracts plain text from a PDF or image upload.
// Input: multer file object containing `buffer`, `mimetype`, and `originalname`.
// Output: normalized extracted text string.
export async function extractText(file) {
    const fileType = detectUploadFileType(file)

    if (!fileType) {
        throw new Error("Unsupported file type")
    }

    if (fileType === "pdf") {
        return extractPdfText(file.buffer)
    }

    return extractImageText(file.buffer)
}

// Extracts text from a PDF buffer using pdf-parse.
// Input: raw PDF buffer from multer memory storage.
// Output: normalized text content extracted from the PDF.
async function extractPdfText(buffer) {
    const parser = new PDFParse({ data: buffer })

    try {
        const result = await parser.getText()
        return normalizeExtractedText(result?.text || "")
    } finally {
        await parser.destroy()
    }
}

// Extracts text from an image buffer using Tesseract OCR.
// Input: raw image buffer from multer memory storage.
// Output: normalized OCR text string.
async function extractImageText(buffer) {
    const worker = await createWorker("eng")

    try {
        const result = await worker.recognize(buffer)
        return normalizeExtractedText(result?.data?.text || "")
    } finally {
        await worker.terminate()
    }
}

// Normalizes OCR/PDF text so downstream title extraction and AI prompts stay clean.
// Input: raw text returned by PDF/OCR libraries.
// Output: trimmed string with normalized whitespace and line breaks.
function normalizeExtractedText(text) {
    return String(text || "")
        .replace(/\u0000/g, " ")
        .replace(/\r/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
}

// Extracts the lowercase file extension from the uploaded filename.
// Input: original uploaded filename.
// Output: extension string without the dot, or an empty string.
function getFileExtension(fileName) {
    const normalizedFileName = String(fileName || "").trim().toLowerCase()
    const parts = normalizedFileName.split(".")

    if (parts.length < 2) {
        return ""
    }

    return parts.pop() || ""
}
