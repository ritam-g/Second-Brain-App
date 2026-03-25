import multer from "multer"

const storage = multer.memoryStorage()

// Stores uploaded files in memory so the controller can extract text and forward the buffer to ImageKit.
// Input: multipart/form-data file stream from Express.
// Output: multer middleware that attaches `req.file` with a memory buffer.
export const upload = multer({
    storage,
    limits: {
        fileSize: 15 * 1024 * 1024,
    },
})
