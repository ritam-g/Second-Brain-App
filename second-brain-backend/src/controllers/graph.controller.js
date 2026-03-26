import { buildKnowledgeGraph } from "../services/graph.service.js"

// Returns a similarity graph for the authenticated user's saved content.
// Input: Express request with authenticated `req.user.id`.
// Output: JSON response containing graph nodes and edges.
export async function getGraphController(req, res) {
    try {
        const graph = await buildKnowledgeGraph(String(req.user.id))

        return res.status(200).json(graph)
    } catch (error) {
        console.error("Graph Error:", error.message)

        return res.status(500).json({
            success: false,
            message: "Graph error",
        })
    }
}
