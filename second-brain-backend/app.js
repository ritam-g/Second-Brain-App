import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import contentRouter from './src/routes/content.routes.js'
import authRouter from './src/routes/auth.routes.js'


const app = express()

// middleware
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))


app.use('/api/content',contentRouter)
app.use('/api/auth',authRouter)
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

export default app
