# 🧠 Second Brain App — System Architecture Blueprint (Clean + Visual)

> Designed for clarity, onboarding, and system reasoning

---

# 🔥 1. SYSTEM OVERVIEW (CLEAN)

```mermaid
flowchart LR
    subgraph FE["Frontend (React)"]
        UI[Pages + Components]
        Hooks[Hooks Layer]
        Redux[State]
    end

    subgraph API["API Layer"]
        Axios[Axios Client]
    end

    subgraph BE["Backend (Express)"]
        Routes
        Controllers
        Services
        Middleware
    end

    subgraph DB["Storage"]
        Mongo[(MongoDB)]
        Pinecone[(Vector DB)]
    end

    subgraph EXT["External"]
        Mistral
        ImageKit
    end

    UI --> Hooks --> Axios --> Routes
    Routes --> Controllers --> Services
    Services --> Mongo
    Services --> Pinecone
    Services --> Mistral
    Services --> ImageKit
```

---

# 📂 2. FOLDER STRUCTURE (VISUAL)

```mermaid
flowchart TD
    ROOT[Project Root]

    ROOT --> FE[frontend/]
    ROOT --> BE[backend/]

    FE --> PAGES[pages/]
    FE --> HOOKS[hooks/]
    FE --> API[api/]
    FE --> COMP[components/]
    FE --> REDUX[redux/]

    BE --> CTRL[controllers/]
    BE --> SERV[services/]
    BE --> ROUTES[routes/]
    BE --> MODELS[models/]
    BE --> MW[middleware/]
```

---

# 🧩 3. FILE RESPONSIBILITY FLOW

```mermaid
flowchart LR
    UI[Dashboard.jsx]
    Hook[useContent.js]
    API[content.api.js]
    Route[content.routes.js]
    Ctrl[content.controller.js]
    Service[metadata + embedding + vector]
    DB[(MongoDB + Pinecone)]

    UI --> Hook --> API --> Route --> Ctrl --> Service --> DB
```

---

# ⚙️ 4. URL SAVE PIPELINE

```mermaid
sequenceDiagram
    participant UI
    participant API
    participant CTRL
    participant META
    participant CHUNK
    participant EMBED
    participant DB

    UI->>API: Save URL
    API->>CTRL: POST /save
    CTRL->>META: Extract metadata
    CTRL->>CHUNK: Split text
    CTRL->>EMBED: Create embeddings
    CTRL->>DB: Store data
    DB-->>UI: Response
```

---

# 📄 5. FILE UPLOAD FLOW

```mermaid
flowchart TD
    A[Upload File] --> B[Detect Type]
    B -->|PDF| C[Extract Text]
    B -->|Image| D[OCR]
    C --> E[Generate Metadata]
    D --> E
    E --> F[Embed Text]
    F --> G[Store in DB + Pinecone]
```

---

# 🔍 6. SEMANTIC SEARCH FLOW

```mermaid
flowchart LR
    Q[User Query] --> E[Embed Query]
    E --> P[Pinecone Search]
    P --> M[Match Content IDs]
    M --> DB[Fetch from MongoDB]
    DB --> R[Return Results]
```

---

# 🤖 7. RAG CHAT FLOW

```mermaid
flowchart TD
    Q[User Question]
    --> E[Embed Query]
    --> S[Search Pinecone]
    --> C[Top Chunks]
    --> P[Build Prompt]
    --> LLM[Mistral]
    --> A[Final Answer]
```

---

# 🧩 8. KNOWLEDGE GRAPH

```mermaid
flowchart TD
    A[All Documents]
    --> B[Get Embeddings]
    --> C[Pairwise Compare]

    C --> D{Similarity > 0.75}

    D -->|Yes| E[Create Edge]
    D -->|No| F[Ignore]
```

---

# 🔁 9. RESURFACING SYSTEM

```mermaid
flowchart TD
    A[All Content]
    --> B[Filter by Date]
    --> C[Score Content]
    --> D[Rank]
    --> E[Top Results]
```

---

# 🔐 10. AUTH FLOW

```mermaid
flowchart TD
    Login --> JWT
    JWT --> Cookie
    Cookie --> Requests
    Requests --> Middleware
    Middleware --> Access
```

---

# 🔗 11. CONNECTION MAP

```mermaid
flowchart LR
    FE --> API --> BE
    BE --> Mongo
    BE --> Pinecone
    BE --> Mistral
```

---

Generated: 2026-03-27
