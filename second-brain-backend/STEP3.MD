# 🧠 STEP 3 → Metadata Extraction (Auto Title, Preview, Image)

## 🎯 Goal

When user saves a URL:
👉 System should automatically fetch:

* title
* description
* image (thumbnail)

---

# 🥇 PART 1: Install Library

We will use:

👉 open-graph-scraper

---

## 📦 Install

```bash
npm install open-graph-scraper
```

---

# 🥈 PART 2: Create Metadata Service

## 📁 File:

src/services/metadata.service.js

---

## 🛠️ What to do:

Create a function:

👉 getMetadata(url)

---

## 🧠 Logic:

1. Send URL to scraper
2. Extract:

   * title
   * description
   * image
3. Return clean object

---

## 📌 Structure Idea:

Return:

```json
{
  "title": "...",
  "description": "...",
  "image": "..."
}
```

---

# 🥉 PART 3: Update Content Model

## 📁 File:

src/models/content.model.js

---

## ➕ Add new fields:

```id="k9y8hf"
description: String,
image: String
```

---

# 🏅 PART 4: Update SAVE API

## 📁 File:

src/controllers/content.controller.js

---

## 🛠️ Update Logic:

Before saving content:

### Step 1:

Call metadata service

### Step 2:

If user DID NOT send title → use metadata title

### Step 3:

Save:

* title
* description
* image

---

## 🧠 Flow:

User sends:

```json
{
  "url": "https://youtube.com/..."
}
```

System does:
👉 Fetch metadata
👉 Save enriched data

---

# 🧪 TEST

POST → /content/save

```json
{
  "url": "https://example.com"
}
```

---

## ✅ SUCCESS RESULT

Saved data should include:

```json
{
  "title": "Actual page title",
  "description": "...",
  "image": "https://..."
}
```

---

# ⚠️ IMPORTANT HANDLING

## If metadata fails:

* Use fallback:

  * title → "No title"
  * description → ""
  * image → ""

---

# 🏁 FINAL CHECKLIST

✔ Metadata service created
✔ Model updated
✔ Save API updated
✔ Auto title working
✔ Description & image saved

---

# 🚫 DON'T DO YET

❌ No AI tagging
❌ No frontend
❌ No extension

---

# 💥 WHY THIS STEP MATTERS

Now your app becomes:
👉 “Smart saver” instead of just storing raw links

---

# 🚀 NEXT STEP

👉 Frontend (React dashboard to see saved data)

---

# 📌 YOUR TASK NOW

1. Install scraper
2. Create metadata service
3. Update model
4. Update save API

---

## 🧠 WHEN DONE

Come back and say:

👉 **“Metadata done”**

Then we move to:
🔥 Frontend dashboard (real UI + API integration)
