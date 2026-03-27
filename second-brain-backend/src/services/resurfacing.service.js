import contentModel from "../models/content.model.js"
import { cosineSimilarity } from "./graph.service.js"

const defaultMonthsAgo = 2
const defaultLimit = 10
const maxMonthsAgo = 120
const debugLookbackDays = 7
const maxCandidateCount = 40
const semanticSimilarityFloor = 0.45
const importantTagKeywords = new Set([
    "important",
    "favorite",
    "favourite",
    "priority",
    "key",
    "core",
    "research",
    "reference",
    "study",
    "thesis",
    "idea",
    "strategy",
])

// Retrieves a time-based resurfacing slice for one user and ranks the best memories inside that window.
// Input: authenticated user id plus a month offset and optional result limit.
// Output: clean list of content documents ready for UI resurfacing cards.
export async function getResurfacedContent({
    userId,
    monthsAgo = defaultMonthsAgo,
    limit = defaultLimit,
    debug = false,
}) {
    const normalizedUserId = String(userId || "").trim()

    if (!normalizedUserId) {
        throw new Error("User id is required to resurface content")
    }

    const normalizedMonthsAgo = normalizeMonthsAgo(monthsAgo)
    const normalizedLimit = normalizeLimit(limit)
    const normalizedDebug = normalizeBoolean(debug)
    const dateWindow = buildDateWindow({
        monthsAgo: normalizedMonthsAgo,
        debug: normalizedDebug,
    })

    const candidates = await findResurfacingCandidates({
        userId: normalizedUserId,
        dateWindow,
    })

    logResurfacingWindow({
        userId: normalizedUserId,
        monthsAgo: normalizedMonthsAgo,
        debug: normalizedDebug,
        dateWindow,
        itemsFound: candidates.length,
    })

    const data = rankResurfacingCandidates({
        candidates,
        dateWindow,
        limit: normalizedLimit,
    })

    return {
        data,
        meta: {
            debug: normalizedDebug,
            mode: dateWindow.mode,
            requestedMonthsAgo: normalizedMonthsAgo,
            requestedLabel: formatResurfacingLabel(normalizedMonthsAgo),
            effectiveLabel: dateWindow.effectiveLabel,
            range: {
                start: dateWindow.start.toISOString(),
                end: dateWindow.end.toISOString(),
            },
            itemsFound: candidates.length,
            returnedCount: data.length,
            emptyReason: data.length
                ? ""
                : normalizedDebug
                    ? "no_recent_test_data"
                    : "no_historical_matches",
        },
    }
}

// Formats a human-readable label for the requested resurfacing window.
// Input: month offset integer.
// Output: label string such as "2 months ago" or "1 year ago".
export function formatResurfacingLabel(monthsAgo = defaultMonthsAgo) {
    const normalizedMonthsAgo = normalizeMonthsAgo(monthsAgo)

    if (normalizedMonthsAgo === 0) {
        return "this month"
    }

    if (normalizedMonthsAgo % 12 === 0) {
        const yearsAgo = normalizedMonthsAgo / 12
        return `${yearsAgo} ${yearsAgo === 1 ? "year" : "years"} ago`
    }

    return `${normalizedMonthsAgo} ${normalizedMonthsAgo === 1 ? "month" : "months"} ago`
}

// Builds the monthly date window used to look up older saved content.
// Input: month offset integer.
// Output: start/end/anchor dates for resurfacing queries and ranking.
function buildDateWindow({ monthsAgo, debug }) {
    const now = new Date()

    if (debug) {
        const start = new Date(now)
        start.setDate(start.getDate() - debugLookbackDays)

        return {
            start,
            end: now,
            anchorDate: now,
            mode: "debug_recent",
            effectiveLabel: `last ${debugLookbackDays} days`,
            windowDurationMs: Math.max(1, now.getTime() - start.getTime()),
        }
    }

    if (monthsAgo === 0) {
        const start = new Date(now.getFullYear(), now.getMonth(), 1)

        return {
            start,
            end: now,
            anchorDate: now,
            mode: "current_month",
            effectiveLabel: formatResurfacingLabel(monthsAgo),
            windowDurationMs: Math.max(1, now.getTime() - start.getTime()),
        }
    }

    const end = shiftDateByMonths(now, -monthsAgo)
    const start = shiftDateByMonths(now, -(monthsAgo + 1))
    const anchorDate = shiftDateByMonths(now, -monthsAgo)

    return {
        start,
        end,
        anchorDate,
        mode: "historical_exact",
        effectiveLabel: formatResurfacingLabel(monthsAgo),
        windowDurationMs: Math.max(1, end.getTime() - start.getTime()),
    }
}

// Reads the raw date-window slice from Mongo before ranking the results for resurfacing.
// Input: user id plus calculated date window.
// Output: candidate content documents from the requested date range.
async function findResurfacingCandidates({ userId, dateWindow }) {
    return contentModel.find({
        userId,
        createdAt: {
            $gte: dateWindow.start,
            $lt: dateWindow.end,
        },
    })
        .select("title url tags category subCategory type description descriptionLanguage image summary createdAt vectorReady contentId +embedding")
        .sort({ createdAt: -1 })
        .limit(maxCandidateCount)
        .lean()
}

// Logs the active resurfacing range only during explicit debug sessions.
// Input: user id, monthsAgo, debug flag, chosen date window, and number of matching items.
// Output: none. Emits console logs when resurfacing debug mode is enabled.
function logResurfacingWindow({ userId, monthsAgo, debug, dateWindow, itemsFound }) {
    if (!debug) {
        return
    }

    console.log("Resurfacing Range:", {
        userId,
        monthsAgo,
        debug,
        mode: dateWindow.mode,
        start: dateWindow.start.toISOString(),
        end: dateWindow.end.toISOString(),
    })
    console.log("Items Found:", itemsFound)
}

// Applies semantic and metadata-aware ranking to the raw date-window candidates.
// Input: candidate documents, date window, and result limit.
// Output: cleaned resurfaced content list ready for API consumers.
function rankResurfacingCandidates({ candidates, dateWindow, limit }) {
    if (!candidates.length) {
        return []
    }

    const similarityScores = buildSimilarityScoreMap(candidates)

    return candidates
        .map(content => ({
            content,
            resurfacingScore: calculateResurfacingScore({
                content,
                dateWindow,
                similarityScore: similarityScores.get(String(content?._id || "")) || 0,
            }),
        }))
        .sort((left, right) => {
            if (right.resurfacingScore !== left.resurfacingScore) {
                return right.resurfacingScore - left.resurfacingScore
            }

            return new Date(right.content?.createdAt || 0).getTime() - new Date(left.content?.createdAt || 0).getTime()
        })
        .slice(0, limit)
        .map(entry => sanitizeResurfacedContent(entry.content))
}

// Scores one resurfacing candidate so richer and more connected memories rank ahead of plain date matches.
// Input: content document, date window, and optional semantic similarity score.
// Output: numeric ranking score.
function calculateResurfacingScore({ content, dateWindow, similarityScore }) {
    const temporalScore = computeTemporalScore(content?.createdAt, dateWindow)
    const importanceScore = computeImportanceScore(content)
    const richnessScore = computeRichnessScore(content)
    const accessScore = computeAccessScore(content)

    return (
        (temporalScore * 0.34)
        + (similarityScore * 0.26)
        + (accessScore * 0.14)
        + (importanceScore * 0.14)
        + (richnessScore * 0.12)
    )
}

// Prefers items created closest to the requested resurfacing moment inside the eligible date range.
// Input: content createdAt value and precomputed date window.
// Output: closeness score between 0 and 1.
function computeTemporalScore(createdAt, dateWindow) {
    const createdAtDate = createdAt instanceof Date ? createdAt : new Date(createdAt)
    const createdAtTime = createdAtDate.getTime()

    if (!Number.isFinite(createdAtTime)) {
        return 0
    }

    const distanceFromAnchor = Math.abs(createdAtTime - dateWindow.anchorDate.getTime())
    const normalizedDistance = Math.min(1, distanceFromAnchor / dateWindow.windowDurationMs)

    return 1 - normalizedDistance
}

// Boosts memories that look more meaningful based on tags and explicit categorization.
// Input: resurfacing candidate document.
// Output: importance signal between 0 and 1.
function computeImportanceScore(content) {
    const normalizedTags = Array.isArray(content?.tags)
        ? content.tags
            .map(tag => String(tag || "").trim().toLowerCase())
            .filter(Boolean)
        : []

    const importantTagBoost = normalizedTags.some(tag => importantTagKeywords.has(tag))
        ? 0.45
        : 0
    const tagDensityBoost = Math.min(0.3, normalizedTags.length * 0.06)
    const categoryBoost = String(content?.category || "").trim() ? 0.14 : 0
    const subCategoryBoost = String(content?.subCategory || "").trim() ? 0.11 : 0

    return clamp01(importantTagBoost + tagDensityBoost + categoryBoost + subCategoryBoost)
}

// Boosts content that has enough metadata to be genuinely useful when resurfaced.
// Input: resurfacing candidate document.
// Output: richness signal between 0 and 1.
function computeRichnessScore(content) {
    let score = 0

    if (String(content?.summary || "").trim()) {
        score += 0.24
    }

    if (String(content?.description || "").trim()) {
        score += 0.2
    }

    if (String(content?.image || "").trim()) {
        score += 0.14
    }

    if (String(content?.url || "").trim()) {
        score += 0.1
    }

    if (content?.vectorReady) {
        score += 0.14
    }

    if (normalizeEmbedding(content?.embedding).length) {
        score += 0.18
    }

    return clamp01(score)
}

// Reads optional engagement-like fields when available so revisited memories can rank slightly higher.
// Input: resurfacing candidate document.
// Output: access signal between 0 and 1.
function computeAccessScore(content) {
    const possibleCounters = [
        content?.accessCount,
        content?.viewCount,
        content?.openCount,
        content?.readCount,
        content?.interactionCount,
    ]
        .map(value => Number(value))
        .filter(value => Number.isFinite(value) && value > 0)

    if (!possibleCounters.length) {
        return 0
    }

    const strongestCounter = Math.max(...possibleCounters)

    return clamp01(Math.log1p(strongestCounter) / Math.log(20))
}

// Uses embedding similarity inside the date window to surface content that belongs to denser semantic clusters.
// Input: candidate content list.
// Output: map keyed by content id with semantic cluster score values.
function buildSimilarityScoreMap(contents) {
    const scores = new Map()
    const buckets = new Map()

    contents.forEach(content => {
        const embedding = normalizeEmbedding(content?.embedding)
        const contentId = String(content?._id || "")

        if (!contentId) {
            return
        }

        scores.set(contentId, 0)

        if (!embedding.length) {
            return
        }

        const dimension = embedding.length
        const bucket = buckets.get(dimension) || []

        bucket.push({
            id: contentId,
            embedding,
        })
        buckets.set(dimension, bucket)
    })

    buckets.forEach(bucket => {
        const adjacency = new Map()

        bucket.forEach(item => {
            adjacency.set(item.id, [])
        })

        for (let sourceIndex = 0; sourceIndex < bucket.length; sourceIndex += 1) {
            const source = bucket[sourceIndex]

            for (let targetIndex = sourceIndex + 1; targetIndex < bucket.length; targetIndex += 1) {
                const target = bucket[targetIndex]
                const similarity = cosineSimilarity(source.embedding, target.embedding)

                if (similarity < semanticSimilarityFloor) {
                    continue
                }

                adjacency.get(source.id)?.push(similarity)
                adjacency.get(target.id)?.push(similarity)
            }
        }

        adjacency.forEach((similarities, contentId) => {
            if (!similarities.length) {
                scores.set(contentId, 0)
                return
            }

            const topSimilarities = similarities
                .sort((left, right) => right - left)
                .slice(0, 3)
            const averageSimilarity = topSimilarities.reduce((sum, value) => sum + value, 0) / topSimilarities.length

            scores.set(contentId, clamp01(averageSimilarity))
        })
    })

    return scores
}

// Removes internal ranking data before resurfaced content is returned to the API consumer.
// Input: ranked content document.
// Output: frontend-safe content object.
function sanitizeResurfacedContent(content) {
    const { embedding, ...safeContent } = content || {}
    return safeContent
}

// Normalizes month offsets so API callers cannot request invalid resurfacing windows.
// Input: raw monthsAgo value.
// Output: bounded positive integer.
function normalizeMonthsAgo(monthsAgo) {
    const numericMonthsAgo = Number(monthsAgo)

    if (!Number.isFinite(numericMonthsAgo) || numericMonthsAgo < 0) {
        return defaultMonthsAgo
    }

    return Math.min(maxMonthsAgo, Math.max(0, Math.round(numericMonthsAgo)))
}

// Normalizes result limit values for resurfacing responses.
// Input: raw limit value.
// Output: bounded positive integer.
function normalizeLimit(limit) {
    const numericLimit = Number(limit)

    if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
        return defaultLimit
    }

    return Math.min(defaultLimit, Math.max(1, Math.round(numericLimit)))
}

// Converts truthy controller inputs into an explicit boolean for debug mode decisions.
// Input: raw query/controller flag.
// Output: boolean.
function normalizeBoolean(value) {
    return value === true || value === "true" || value === 1 || value === "1"
}

// Shifts a date by whole months while preserving the day where possible.
// Input: source date and month delta.
// Output: cloned shifted date.
function shiftDateByMonths(sourceDate, monthDelta) {
    const result = new Date(sourceDate)
    const originalDay = result.getDate()

    result.setDate(1)
    result.setMonth(result.getMonth() + monthDelta)

    const lastDayOfShiftedMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()
    result.setDate(Math.min(originalDay, lastDayOfShiftedMonth))

    return result
}

// Ensures only valid numeric embeddings are used in semantic resurfacing ranking.
// Input: raw embedding value from Mongo.
// Output: numeric embedding array or empty array.
function normalizeEmbedding(embedding) {
    if (!Array.isArray(embedding) || !embedding.length) {
        return []
    }

    const numericEmbedding = embedding.map(value => Number(value))

    return numericEmbedding.every(value => Number.isFinite(value)) ? numericEmbedding : []
}

// Clamps a numeric score into the 0..1 range.
// Input: arbitrary numeric value.
// Output: safe normalized score.
function clamp01(value) {
    return Math.min(1, Math.max(0, Number(value) || 0))
}
