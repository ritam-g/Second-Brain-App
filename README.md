# 🧠 Second Brain App
*An AI-powered, multi-modal knowledge management system that automatically organizes your digital life.*

## 🧠 Concept (Second Brain Idea)
The "Second Brain" concept is simple: your mind is for having ideas, not holding them. This application acts as a digital extension of your brain. Instead of manually organizing folders, tagging bookmarks, or trying to remember where you saved a specific link or PDF, you simply dump your resources into the app. The AI automatically reads, categorizes, connects, and resurfaces the information exactly when you need it.

## 🚀 Overview
**What this project does:**
The Second Brain App is an intelligent knowledge base that accepts URLs, PDFs, and Images. It automatically extracts text, generates metadata using AI, maps relationships across your content using semantic vectors, and provides a RAG (Retrieval-Augmented Generation) chat to interrogate your data.

**Why it is useful:**
We inherently lose track of digital content we save. This app eliminates the manual labor of organizing bookmarks, files, or notes. With natural language search and automated graph mapping, your knowledge stays instantly accessible.

**Real-world use case:**
A researcher or student saves dozens of PDF articles, YouTube tutorials, and tweets about "Machine Learning." Instead of searching folder names or exact titles, they can ask the app, *"What were the key concepts of neural networks from the articles I saved last month?"*, and the app will synthesize an answer directly from their saved content.

## ✨ Features
* **🔗 Multi-Modal Ingestion:** Save web links, YouTube videos, PDFs, and images seamlessly.
* **🤖 Auto-Tagging & Metadata:** Generates smart titles, descriptions, and categories via Mistral AI.
* **🔍 Semantic Search:** Find documents by meaning instead of exact keywords using Pinecone Vector DB.
* **💬 Deep Focus (RAG Chat):** Chat with your saved documents to summarize content or find specific insights.
* **🕸️ Knowledge Graph:** Visualizes how your ideas overlap through an interactive D3.js node graph.
* **⏳ Memory Resurfacing:** Automatically brings back older, highly relevant content to spark new ideas based on temporal and semantic algorithms.

## ⚙️ How It Works
1. **Input:** The user uploads a PDF/Image or pastes a URL into the dashboard.
2. **Extraction:**
   - Text is parsed via `pdf-parse` or `Tesseract.js` (OCR).
   - URLs are scraped for Open Graph metadata or YouTube oEmbed data.
3. **AI Processing:** Extracted content is passed to Mistral AI to determine categories, sub-categories, and structural tags.
4. **Vectorization:** Text is chunked and embedded into 1024-dimensional vectors.
5. **Storage:** Vectors are saved in Pinecone, original files backed up to ImageKit, and complete metadata to MongoDB.
6. **Retrieval:** Users search naturally, and the system fetches the nearest vector neighbors to present highly relevant results or generate chat answers.

## 🛠️ Tech Stack
* **Frontend:** React 19, Vite, Redux Toolkit, Tailwind CSS, Framer Motion, D3.js
* **Backend:** Node.js, Express.js
* **Database & Storage:** MongoDB Atlas (Metadata), Pinecone (Vector DB), ImageKit (CDN)
* **AI & Processing:** LangChain, Mistral AI (`mistral-small-latest`, `mistral-embed`), Tesseract.js (OCR), `pdf-parse`

## 📂 Folder Structure
```text
second-brain-app/
├── second-brain-frontend/        # React User Interface
│   ├── src/api/                  # Axios API connectors
│   ├── src/components/           # Reusable UI elements (Masonry, GraphCanvas, etc.)
│   ├── src/features/             # Complex logic loops (Chat, Search, Resurfacing)
│   ├── src/hooks/                # Data pipelines and custom hooks
│   ├── src/pages/                # Primary application screens
│   └── src/redux/                # Global state management slices
│
└── second-brain-backend/         # Express API & Services
    ├── src/controllers/          # Route logic & HTTP response handling
    ├── src/services/             # Heavy lifting (AI, OCR, Embedding, Vector ops)
    ├── src/models/               # Mongoose DB Schemas
    ├── src/middlewares/          # Authentication & Multer upload handlers
    └── src/routes/               # Endpoint declarations
```

## 📦 Installation & Setup

### Prerequisites
* Node.js (v18+)
* MongoDB Account
* Pinecone API Key
* Mistral AI API Key
* ImageKit Account

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/second-brain-app.git
cd second-brain-app
```

### 2. Backend Setup
```bash
cd second-brain-backend
npm install
```
Create a `.env` file in the `second-brain-backend` folder based on `.env.example`:
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
MISTRAL_API_KEY=your_mistral_api_key
PINECONE_API_KEY=your_pinecone_api_key
IMAGEKIT_PUBLIC_KEY=your_imagekit_public
IMAGEKIT_PRIVATE_KEY=your_imagekit_private
IMAGEKIT_URL_ENDPOINT=your_imagekit_url
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal tab and navigate to the frontend:
```bash
cd second-brain-frontend
npm install
```
Create a `.env` file in the `second-brain-frontend` folder:
```env
VITE_API_URL=http://localhost:3000/api
```
Start the frontend development server:
```bash
npm run dev
```

## 📌 Usage
1. **Register/Login:** Create an account to access your personal workspace.
2. **Add Content:** Click "Save" to paste a URL or "Upload" to process a PDF/Image.
3. **Explore Dashboard:** View your automatically tagged and generated content on the Knowledge Canvas.
4. **Search:** Use the main search bar to find answers by describing what you are looking for contextually.
5. **View Graph:** Click over to the Graph visualizer to see how your saved ideas intersect visually.
6. **Deep Focus:** Enter the chat area to ask specific questions about the data you've archived.

## 📸 Screenshots
*(Coming Soon - Add snapshots of your Dashboard, Graph Canvas, and Deep Focus Chat here)*
