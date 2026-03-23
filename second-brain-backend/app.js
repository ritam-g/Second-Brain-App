import express from 'express'
import contentRouter from './src/routes/content.routes.js'


const app = express()

// middleware
app.use(express.json())


app.use('/api/content',contentRouter)


export default app