# 🧠 Second Brain: AI-Automated Knowledge System Roadmap

A comprehensive architectural guide and execution plan to transform a simple media archiver into a fully autonomous, self-organizing knowledge engine.

---

## 1. Project Overview
The "Second Brain" is an intelligent repository that ingests multi-modal content (Articles, Tweets, PDFs, Images, Videos). It moves beyond manual folder structures by using **Semantic Search**, **Automatic Clustering**, and **Graph Visualization** to link fragmented ideas into a unified knowledge web.

---

## 2. Current vs. Expected Analysis (Updated March 2026)

| Feature | Current State | Target (Top 5% System) | Gap |
| :--- | :--- | :--- | :--- |
| **Ingestion** | Links, PDFs, Images | Browser Extension + YouTube + Twitter Scraper | High |
| **Search** | **Vector-based Semantic Search** | Multi-modal Search (Image/Text) | ✅ **Closed** |
| **Organization** | AI Tags & Metadata (Mistral) | Topic Clustering & Auto-Collections | High |
| **Relationship** | Isolated Items | **Knowledge Graph (D3.js)** | High |
| **Retention** | Static Dashboard | **Proactive Memory Resurfacing** | Medium |
| **Storage** | **MongoDB + Pinecone (Hybrid)** | High-Availability Distributed Sync | ✅ **Closed** |

---

## 3. Architecture Flow (Implemented Pipeline)

```mermaid
graph TD
    A[Multi-modal Input] --> B[Processing Pipeline (OCR/PDF)]
    B --> C[Vector Embedding Engine (Mistral)]
    C --> D[Hybrid Storage (Mongo + Pinecone)]
    D --> E[Semantic Search (Live)]
    D --> F[Auto-Clustering (Planned)]
    D --> G[Graph Visualization (Planned)]
    F --> H[Memory Resurfacing (Planned)]
```

1.  **Ingestion**: Receives file buffer (PDF/Image) or URL.
2.  **Processing**: Extracts text via **Tesseract.js** (OCR) or **pdf-parse**. (✅ Done)
3.  **Embedding**: Converts chunks into vectors via **Mistral AI**. (✅ Done)
4.  **Storage**: Metadata in **MongoDB**; Vectors in **Pinecone**. (✅ Done)
5.  **Intelligence**: Runs similarity math for search (✅ Done) and future clusters/graph.

---

## 4. Step-by-Step Execution Plan (Status Update)

### ✅ Module 1: Content Ingestion Improvements
*   **Current Status**: Basic file and URL ingestion implemented.
*   **Target**: Dedicated scrapers for YouTube transcripts and Twitter thread extraction.

### ✅ Module 2: Processing Pipeline (Implemented)
*   **What was built**: A Recursive Text Splitter to handle long PDFs and Articles.
*   **Status**: **DONE**. Text is extracted, normalized, and chunked (1000 chars) for embedding.
*   **Libraries**: `langchain`, `tesseract.js`, `pdf-parse`.

### ✅ Module 3: Storage (Hybrid Strategy - Implemented)
*   **What was built**: Sync layer between MongoDB and Pinecone.
*   **Status**: **DONE**. Content metadata maps to Pinecone vector IDs deterministically.
*   **Libraries**: `@pinecone-database/pinecone`, `mongoose`, `ImageKit`.

### ✅ Module 4: Semantic Search (Implemented)
*   **What was built**: A search endpoint that converts query into a vector and finds neighbors in Pinecone.
*   **Status**: **DONE**. Semantic search is live on the dashboard with hydration.
*   **Logic**: Query → embedQuery → Pinecone → Mongo Hydration.

### ⏳ Module 5: AI Tagging (Upgrades)
*   **What to build**: Hierarchical tagging (Category > Sub-category).
*   **Current Status**: Single-level AI tagging is live; hierarchical mapping is parity.

### ⏳ Module 6: Topic Clustering
*   **What to build**: A service that groups similar items into "automated collections."
*   **Logic**: Use Cosine Similarity on existing vectors.

### ⏳ Module 7: Knowledge Graph
*   **What to build**: A force-directed graph showing items as nodes and shared semantic edges.
*   **Relation Logic**: Similarity-based edge creation.

### ⏳ Module 8: Resurfacing System
*   **What to build**: "Spaced Repetition" engine that highlights old content.

---

## 5. Implementation Log (Recent Accomplishments)
1.  **Semantic Retrieval**: Switched from Regex-based title search to full-text semantic searching.
2.  **AI Metadata**: Added Mistral-powered auto-generation for titles and descriptions for every upload.
3.  **Vector Sync**: Implemented automated deletion of vectors when content is removed from MongoDB.
4.  **Premium UI**: Launched the "Knowledge Canvas" frontend with masonry layout and responsive tags.

---

## 6. Execution Order (Priority List)
1.  **Knowledge Graph API**: Endpoint to return Node/Edge data for the UI. (Highest Priority)
2.  **Graph Visualization**: Custom D3.js component for the Knowledge Canvas.
3.  **Advanced Scrapers**: YouTube and Social thread reconstructed content.
4.  **Auto-Clustering**: Background worker to group items.

---

## 7. Final Result
The system is now a **Semantic Knowledge Base**. Instead of a list of dead links, the user has an intelligent, searchable archive that understands context. The next major leap is turning this list into a **Visual Knowledge Web**.
