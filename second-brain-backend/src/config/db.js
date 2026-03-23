import mongoose from "mongoose";
import 'dotenv/config'
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('Connected to MongoDB');
    } catch (error) {
        log.error('Error connecting to MongoDB:', error);
        process.exit(1);
        
    }
}

export default connectDB