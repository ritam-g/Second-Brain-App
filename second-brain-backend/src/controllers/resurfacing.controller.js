import { getResurfacedContent } from "../services/resurfacing.service.js"

// Returns time-based memory resurfacing results for the authenticated user.
// Input: Express request with `req.user.id` and optional `monthsAgo` query.
// Output: JSON response containing a label and resurfaced content list.
export async function getResurfacedController(req, res) {
    try {
        const monthsAgo = Number(req.query.monthsAgo ?? 2)
        const debug = parseBooleanQuery(req.query.debug)
        const response = await getResurfacedContent({
            userId: req.user.id,
            monthsAgo,
            debug,
        })

        return res.status(200).json({
            success: true,
            label: response.meta.requestedLabel,
            data: response.data,
            meta: response.meta,
        })
    } catch (error) {
        console.error("Resurfacing Error:", error.message)

        return res.status(500).json({
            success: false,
            message: "Failed to fetch resurfaced content",
        })
    }
}

function parseBooleanQuery(value) {
    return value === true || value === "true" || value === 1 || value === "1"
}
