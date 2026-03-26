import "dotenv/config"
import app from "./app.js"
import connectDB from "./src/config/db.js"

const PORT = process.env.PORT || 3000

async function startServer() {
    await connectDB()

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    })
}

startServer().catch(error => {
    console.error("Server Startup Error:", error)
    process.exit(1)
})
