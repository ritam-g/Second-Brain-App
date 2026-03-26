import mongoose from "mongoose"
import "dotenv/config"

async function connectDB() {
    const mongoUri = String(process.env.MONGO_URI || "").trim()

    if (!mongoUri) {
        throw new Error("MONGO_URI is not configured")
    }

    try {
        await mongoose.connect(mongoUri)
        console.log("Connected to MongoDB")
    } catch (error) {
        console.error("Error connecting to MongoDB:", error)
        process.exit(1)
    }
}

export default connectDB
