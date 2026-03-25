import contentModel from "../models/content.model.js"
import { getMetadata } from "../services/metadata.service.js"
// Consolidated documentation in routes file
/** 
 * Controller to save new content (URL/Metadata)
 */
export async function saveContentController(req, res) {
    try {
        const { url, title } = req.body;

        // ✅ 1. Validate input
        if (!url) {
            return res.status(400).json({ message: "URL is required" });
        }

        // ✅ 2. Fetch metadata
        const meta = await getMetadata(url);

        // ✅ 3. Create content
        const content = await contentModel.create({
            url,
            title: title || meta.title || "No title",
            description: meta.description || "",
            image: meta.image || "",
            type: meta.type || "article",
            tags: meta.tags || [],
            userId: req.user.id,
        });

        // ✅ 4. Send response
        return res.status(201).json({
            success: true,
            data: content,
        });

    } catch (error) {
        console.error("Save Content Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to save content",
        });
    }
}

/**
 * Controller to fetch all content for the authenticated user
 */

export async function getContentAllController(req, res, next) {
    try {
        const contents = await contentModel.find({ userId: req.user.id }).sort({ createdAt: -1 })
        return res.status(200).json({
            success: true,
            data: contents
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message })
    }
}

/**
 * Controller to delete specific content by ID
 */
export async function DeleteContentController(req, res, next) {
    try {
        const contentId = req.params.id
        const deletedContent = await contentModel.findOneAndDelete({ _id: contentId, userId: req.user.id })
        if (!deletedContent) {
            return res.status(404).json({ message: "Content not found or not authorized" })
        }
        return res.status(200).json({
            success: true,
            message: "Content deleted successfully",
            data: deletedContent
        })
    } catch (error) {
        console.error("Delete Content Error:", error.message);
        return res.status(500).json({ 
            success: false,
            error: error.message 
        })
    }
}


export async function getSingleUserContentController(req,res,next) {
    try {
        const id=req.user.id
        const content=await contentModel.find({userId:id})
        if(!content){
            return res.status(404).json({message:"Content not found"})
        }
        return res.status(200).json({
            success:true,
            data:content
        })
    } catch (error) {
        console.error("Get Single User Content Error:", error.message);
        return res.status(500).json({
            success:false,
            error:error.message
        })
    }
}

export async function proxyContentImageController(req, res) {
    try {
        const imageUrl = String(req.query.url || "").trim();
        const sourceUrl = String(req.query.source || "").trim();

        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                message: "Image URL is required",
            });
        }

        let parsedImageUrl;

        try {
            parsedImageUrl = new URL(imageUrl);
        } catch {
            return res.status(400).json({
                success: false,
                message: "Invalid image URL",
            });
        }

        if (!["http:", "https:"].includes(parsedImageUrl.protocol)) {
            return res.status(400).json({
                success: false,
                message: "Only HTTP(S) image URLs are supported",
            });
        }

        if (isBlockedProxyHost(parsedImageUrl.hostname)) {
            return res.status(400).json({
                success: false,
                message: "Unsupported image host",
            });
        }

        // Some providers allow opening the image URL directly but block hotlinking from browser <img> tags.
        // Fetching server-side with a matching referer/user-agent makes those previews render reliably in the app.
        const referer = getSafeReferer(sourceUrl, parsedImageUrl);
        const response = await fetch(parsedImageUrl, {
            headers: {
                "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                "accept-language": "en-US,en;q=0.9",
                "referer": referer,
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
            },
            redirect: "follow",
        });

        if (!response.ok) {
            return res.status(502).json({
                success: false,
                message: "Failed to fetch image preview",
            });
        }

        const contentType = String(response.headers.get("content-type") || "").toLowerCase();

        if (!contentType.startsWith("image/")) {
            return res.status(415).json({
                success: false,
                message: "Preview URL did not return an image",
            });
        }

        const cacheControl = response.headers.get("cache-control");
        const contentLength = response.headers.get("content-length");
        const imageBuffer = Buffer.from(await response.arrayBuffer());

        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", cacheControl || "public, max-age=86400");

        if (contentLength) {
            res.setHeader("Content-Length", contentLength);
        }

        return res.status(200).send(imageBuffer);
    } catch (error) {
        console.error("Image Proxy Error:", error.message);
        return res.status(502).json({
            success: false,
            message: "Failed to load image preview",
        });
    }
}

function getSafeReferer(sourceUrl, parsedImageUrl) {
    try {
        if (sourceUrl) {
            const parsedSourceUrl = new URL(sourceUrl);

            if (["http:", "https:"].includes(parsedSourceUrl.protocol)) {
                return parsedSourceUrl.origin + "/";
            }
        }
    } catch {
        // Ignore malformed source URLs and fall back to the image host origin.
    }

    return parsedImageUrl.origin + "/";
}

function isBlockedProxyHost(hostname) {
    const normalizedHost = String(hostname || "").toLowerCase();

    if (!normalizedHost) {
        return true;
    }

    // Prevent the proxy from being used against local/private network addresses.
    if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(normalizedHost)) {
        return true;
    }

    if (/^10\.\d+\.\d+\.\d+$/.test(normalizedHost)) {
        return true;
    }

    if (/^192\.168\.\d+\.\d+$/.test(normalizedHost)) {
        return true;
    }

    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(normalizedHost)) {
        return true;
    }

    return false;
}
