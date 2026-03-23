import app from "./app.js";
import 'dotenv/config'
import connectDB from "./src/config/db.js";


const PORT=process.env.PORT || 3000

connectDB()
app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`)
})