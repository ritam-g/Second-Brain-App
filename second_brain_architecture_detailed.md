# 🧠 Second Brain App — FULL Detailed Architecture (With Proper Diagrams)

---

# 🔥 1. COMPLETE SYSTEM ARCHITECTURE (Frontend → Backend → Services)

```mermaid
flowchart LR
    subgraph FE[Frontend React App]
        A1[Dashboard.jsx]
        A2[GraphPage.jsx]
        A3[DeepFocus.jsx]
        A4[Auth Pages]
    end

    subgraph HOOKS[Hooks Layer]
        H1[useContent.js]
        H2[useSemanticSearch.js]
        H3[useChat.js]
        H4[useResurfacing.js]
        H5[useAuth.js]
    end

    subgraph API[API Layer]
        API1[content.api.js]
        API2[rag.api.js]
        API3[graph.api.js]
        API4[resurfacing.api.js]
        API5[auth.api.js]
        API6[client.js]
    end

    subgraph BE[Backend Express]
        MW[Auth Middleware]

        subgraph CTRL[Controllers]
            C1[content.controller.js]
            C2[search.controller.js]
            C3[rag.controller.js]
            C4[graph.controller.js]
            C5[resurfacing.controller.js]
            C6[auth.controller.js]
        end

        subgraph SERV[Services]
            S1[metadata.service.js]
            S2[extract.service.js]
            S3[chunk.service.js]
            S4[embedding.service.js]
            S5[vector.service.js]
            S6[ai.service.js]
            S7[aiTagging.service.js]
            S8[retrieval.service.js]
            S9[graph.service.js]
            S10[resurfacing.service.js]
            S11[upload.service.js]
        end
    end

    subgraph EXT[External]
        E1[Mistral AI]
        E2[Pinecone]
        E3[MongoDB]
        E4[ImageKit]
    end

    FE --> HOOKS --> API --> BE
    BE --> CTRL --> SERV
    SERV --> EXT
```

---

# 📂 2. FOLDER + FILE RELATIONSHIP (IMPORTANT)

```mermaid
flowchart TD
    ROOT[Project Root]

    ROOT --> FE[frontend/]
    ROOT --> BE[backend/]

    FE --> FE1[src/pages/]
    FE --> FE2[src/hooks/]
    FE --> FE3[src/api/]
    FE --> FE4[src/components/]
    FE --> FE5[src/redux/]

    BE --> BE1[src/controllers/]
    BE --> BE2[src/services/]
    BE --> BE3[src/routes/]
    BE --> BE4[src/models/]
    BE --> BE5[src/middleware/]

    BE1 --> C1[content.controller.js]
    BE2 --> S1[embedding.service.js]
    BE3 --> R1[content.routes.js]
```

---

# ⚙️ 3. URL SAVE PIPELINE (DETAILED FLOW)

```mermaid
sequenceDiagram
    participant UI as Dashboard.jsx
    participant Hook as useContent.js
    participant API as content.api.js
    participant CTRL as content.controller.js
    participant META as metadata.service.js
    participant CHUNK as chunk.service.js
    participant EMBED as embedding.service.js
    participant VEC as vector.service.js
    participant DB as MongoDB

    UI->>Hook: save(url)
    Hook->>API: POST /content/save
    API->>CTRL: request
    CTRL->>META: extract metadata
    META-->>CTRL: title, desc, image
    CTRL->>CHUNK: split text
    CHUNK-->>CTRL: chunks
    CTRL->>EMBED: generate embeddings
    EMBED-->>CTRL: vectors
    CTRL->>VEC: store vectors
    VEC->>DB: save metadata
    DB-->>UI: success response
```

---

# 🔍 4. SEMANTIC SEARCH FLOW (DETAILED)

```mermaid
sequenceDiagram
    participant UI as SearchBar
    participant Hook as useSemanticSearch
    participant API as content.api.js
    participant CTRL as search.controller.js
    participant RET as retrieval.service.js
    participant EMB as embedding.service.js
    participant VEC as Pinecone
    participant DB as MongoDB

    UI->>Hook: type query
    Hook->>API: POST /search
    API->>CTRL: request
    CTRL->>EMB: embed query
    EMB->>VEC: search vectors
    VEC-->>RET: matches
    RET->>DB: fetch documents
    DB-->>UI: results
```

---

# 🤖 5. RAG CHAT FLOW (CLEAR + DETAILED)

```mermaid
sequenceDiagram
    participant UI as Chat UI
    participant Hook as useChat
    participant API as rag.api.js
    participant CTRL as rag.controller.js
    participant RET as retrieval.service.js
    participant AI as ai.service.js
    participant LLM as Mistral

    UI->>Hook: send message
    Hook->>API: POST /rag/query
    API->>CTRL: request
    CTRL->>RET: retrieve chunks
    RET-->>CTRL: sources
    CTRL->>AI: generate answer
    AI->>LLM: prompt
    LLM-->>UI: answer
```

---

# 🧩 6. KNOWLEDGE GRAPH FLOW

```mermaid
flowchart TD
    A[All Content Embeddings]
    --> B[Pairwise Comparison]
    --> C[Cosine Similarity]
    --> D{> 0.75?}
    D -->|Yes| E[Create Edge]
    D -->|No| F[Ignore]
```

---

# 🔁 7. RESURFACING FLOW

```mermaid
flowchart TD
    A[Content DB]
    --> B[Filter by Date Window]
    --> C[Compute Scores]
    --> D[Rank]
    --> E[Top Content Returned]
```

---

# 📦 8. STORAGE FLOW (IMPORTANT)

```mermaid
flowchart LR
    Input --> MongoDB
    Input --> Pinecone

    MongoDB -->|Full Data| UI
    Pinecone -->|Vectors| Search Engine
```

---

# 🔐 9. AUTH FLOW

```mermaid
flowchart TD
    Login --> JWT
    JWT --> Cookie
    Cookie --> Backend Requests
    Backend Requests --> Auth Middleware
```

---

# 🧠 FINAL UNDERSTANDING

This system works like:

```mermaid
flowchart TD
    Input --> Processing
    Processing --> Storage
    Storage --> Retrieval
    Retrieval --> Intelligence
```

---

**Now this version includes:**
✔ File-level diagrams  
✔ Folder structure diagrams  
✔ Pipeline sequence diagrams  
✔ Clear system separation  
✔ Visual explanation of flows  

---

Generated: 2026-03-27
