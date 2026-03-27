import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import contentRouter from './src/routes/content.routes.js'
import authRouter from './src/routes/auth.routes.js'
import searchRouter from './src/routes/search.routes.js'
import ragRouter from './src/routes/rag.routes.js'
import graphRouter from './src/routes/graph.routes.js'
import resurfacingRouter from './src/routes/resurfacing.routes.js'

const isProduction = process.env.NODE_ENV === 'production'

// CORS origin is driven by env var so the same codebase works locally and on Render.
// In production: set CORS_ORIGIN to your Render static site URL (e.g. https://second-brain.onrender.com)
// In development: falls back to the Vite dev server default.
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}))


app.use('/api/content', contentRouter)
app.use('/api/auth', authRouter)
app.use('/api/graph', graphRouter)
app.use('/api/resurface', resurfacingRouter)
app.use('/api', searchRouter)
app.use('/api', ragRouter)
// Global error handler for JSON parsing errors (e.g. malformed JSON in request body)
app.use((err, req, res, next) => {
    if (err?.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            message: err.message
        })
    }

    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Malformed JSON payload: Expected double-quoted property names or fixed missing commas (Position: ' + (err.at || 'near') + ')'
        });
    }
    next();
});

// ────────── FRONTEND SERVING ──────────
// Serve static assets (CSS, JS, Images) from the built dist folder
const frontendDistPath = path.join(__dirname, '../second-brain-frontend/dist')

app.use(express.static(frontendDistPath))

// Catch-all: Send index.html for any request that doesn't match an API route.
// This allows React Router (SPA) to handle the routing internally.
app.get('*any', (req, res) => {
    // Only serve index.html for non-API routes
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(frontendDistPath, 'index.html'))
    } else {
        res.status(404).json({ success: false, message: 'API route not found' })
    }
})

export default app
