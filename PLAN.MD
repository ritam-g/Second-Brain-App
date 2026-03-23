# 🧠 Second Brain App (AI Knowledge Saver)

## 📌 Overview

A system where users can save any content from the internet and the app automatically organizes, relates, and resurfaces it.

### User Can Save:

* Articles (links)
* YouTube videos
* Tweets
* Images
* PDFs

### System Features:

* Tag suggestions (AI optional)
* Topic clustering
* Related content suggestions
* Memory resurfacing (e.g., “You saved this 2 months ago”)
* Collections
* Highlight system

---

# 🚀 MVP (Start Small - IMPORTANT)

## ✅ Must Have:

* Save link
* View saved content
* Add tags manually
* Basic search

## ❌ Skip Initially:

* AI tagging
* Graph visualization
* Browser extension
* Vector DB

---

# 🏗️ Backend Structure (Node.js + Express)

```
backend/
 ├── src/
 │   ├── controllers/
 │   ├── models/
 │   ├── routes/
 │   ├── services/
 │   ├── utils/
 │   ├── middlewares/
 │   └── config/
 ├── app.js
 └── server.js
```

---

## 🧩 Core Models

### User

```
name
email
password
```

### Content (Main)

```
userId
type (article, youtube, image, pdf)
title
url
tags []
notes
createdAt
```

---

## 🔥 APIs

```
POST   /content/save
GET    /content
GET    /content/:id
DELETE /content/:id
```

---

## 🧠 Logic

When saving content:

* Extract metadata (title, thumbnail)
* Store in DB

Suggested Library:

* open-graph-scraper

---

# 🎨 Frontend (React / Next.js)

## Pages

```
/dashboard
/save
/content/:id
```

## Components

* Save Form
* Content Card
* Tag Filter
* Search Bar

## Flow

User pastes link → clicks save → appears on dashboard

---

# ⚡ Phase 3: AI Features

## 🔹 Auto Tagging

Convert content → generate tags

Example:

```
"React hooks tutorial" → ["react", "frontend", "hooks"]
```

## 🔹 Semantic Search

* Convert content → embeddings
* Store in vector DB

Tools:

* OpenAI / HuggingFace
* MongoDB Atlas Vector Search / Pinecone

---

# 🔄 Phase 4: Resurfacing

* Use cron job / worker
* Show old saved content

Example:

```
"You saved this 2 months ago 👀"
```

---

# 🕸️ Phase 5: Knowledge Graph

* Use d3.js
* Nodes = content
* Edges = related items

---

# 🌐 Phase 6: Browser Extension

## Structure

```
extension/
 ├── manifest.json
 ├── popup.html
 ├── popup.js
 └── content.js
```

## Flow

1. User clicks extension
2. Get current tab URL
3. Send to backend API

---

## Example

### manifest.json

```json
{
  "manifest_version": 3,
  "name": "Save to Brain",
  "version": "1.0",
  "permissions": ["activeTab"],
  "action": {
    "default_popup": "popup.html"
  }
}
```

### popup.js

```js
document.getElementById("save").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  fetch("http://localhost:3000/content/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: tab.url })
  });
});
```

---

# 🧱 Infrastructure (Later)

* File Storage → AWS S3 / Cloudinary
* Queue → BullMQ / Redis
* Background Jobs → tagging, embeddings

---

# 🧭 Roadmap (Follow Strictly)

## Week 1

* Backend CRUD
* Database setup
* Save content

## Week 2

* Frontend dashboard
* Display content
* Tag filtering

## Week 3

* Metadata extraction
* AI tagging

## Week 4

* Semantic search

## Week 5

* Browser extension

## Week 6

* Graph visualization

---

# 📊 System Diagram

```
          [ Browser Extension ]
                    |
                    v
              [ Backend API ]
                    |
        -------------------------
        |           |           |
        v           v           v
   [ Database ] [ AI Service ] [ Queue Worker ]
        |           |           |
        |           v           |
        |     [ Embeddings ]    |
        |           |           |
        --------> [ Vector DB ] <--------
                    |
                    v
               [ Frontend ]
                    |
                    v
               [ User UI ]
```

---

# ⚠️ Final Advice

* Don’t build everything at once
* First make it WORK → then make it SMART
* Focus on MVP → then scale

---

# 💡 Final Output Goal

A full system where:

* User saves content
* System organizes it
* AI enhances it
* Old knowledge resurfaces

---

🔥 This project = Resume + Interview Gold
