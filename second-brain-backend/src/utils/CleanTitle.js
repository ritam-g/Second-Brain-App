export function cleanTitle(title) {
    if (!title || typeof title !== "string") return "No title";

    return title
        .replace(/- YouTube$/i, "")          // YouTube
        .replace(/\|.*$/, "")               // "Title | Site"
        .replace(/•.*$/, "")                // "Title • Twitter"
        .replace(/on Twitter.*$/i, "")      // Twitter/X
        .replace(/on X.*$/i, "")            // X (new Twitter)
        .replace(/\(.*?\)$/g, "")           // remove brackets (optional)
        .trim();
}