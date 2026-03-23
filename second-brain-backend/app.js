import express from 'express'
import contentRouter from './src/routes/content.routes.js'


const app = express()

// middleware
app.use(express.json())

// Global error handler for JSON parsing errors (e.g. malformed JSON in request body)
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ 
            success: false, 
            message: 'Malformed JSON payload: Expected double-quoted property names or fixed missing commas (Position: ' + (err.at || 'near') + ')'
        });
    }
    next();
});

app.use('/api/content',contentRouter)


export default app