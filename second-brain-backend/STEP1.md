# 🧠 Second Brain Backend – Step-by-Step Guide

## 🎯 Goal

Build a backend where user can:

* Save content (link, title)
* Fetch saved content

---

# 🥇 STEP 1: Setup Basic Server

## 📌 Task:

Make sure your server runs

### 👉 app.js

* create express app
* use express.json()

### 👉 server.js

* import app
* start server on port 3000

### ✅ Check:

Open browser → `http://localhost:3000`
You should see: `"API working"`

---

# 🥈 STEP 2: Connect Database

## 📌 Task:

Connect MongoDB

### 👉 Create:

`src/config/db.js`

### 👉 Work:

* import mongoose
* connect using `MONGO_URI` from `.env`

### 👉 Update:

* call DB function inside `server.js`

### ✅ Check:

Console should print:
`DB connected`

---

# 🥉 STEP 3: Create Content Model (MOST IMPORTANT)

## 📌 Task:

Create your main data structure

### 👉 File:

`src/models/content.model.js`

### 👉 Fields:

* userId
* title
* url
* type
* tags (array)

### ✅ Check:

No error in server

---

# 🏅 STEP 4: Create First Route (VERY IMPORTANT)

## 🎯 First API:

👉 `POST /content/save`

---

## 📌 Task:

### 1. Controller

📁 `src/controllers/content.controller.js`

* create function `saveContent`
* get `url` and `title` from req.body
* save into DB

---

### 2. Route

📁 `src/routes/content.routes.js`

* create router
* connect `/save` → controller

---

### 3. Connect Route

📁 `app.js`

* use:
  `/content`

---

## ✅ Final API:

POST → `/content/save`

---

## 🧪 TEST (VERY IMPORTANT)

Use Postman:

```json
POST http://localhost:3000/content/save

{
  "url": "https://example.com",
  "title": "Test Article"
}
```

---

## ✅ Success Condition:

* Data saved in MongoDB
* Response comes back

---

# 🏆 STEP 5: Get All Content

## 🎯 API:

👉 `GET /content`

---

## 📌 Task:

* create new controller function
* fetch all data using `find()`

---

## ✅ Check:

You should see all saved items

---

# 🧠 STEP 6: Clean Structure (Important Habit)

After everything works:

* move logic into controllers
* keep routes clean
* don’t mix everything in one file

---

# 🚫 WHAT NOT TO DO NOW

❌ Don’t add AI
❌ Don’t add extension
❌ Don’t add graph

---

# 🧭 CURRENT TARGET

👉 Only focus on this:

1. Server running
2. DB connected
3. POST /content/save working
4. GET /content working

---

# 💥 GOLDEN RULE

👉 “If save API is not working → STOP everything and fix it”

---

# 🚀 AFTER COMPLETING THIS

Next step will be:

* metadata extraction (title auto-fetch)
* frontend integration

---

# 📌 YOUR ACTION NOW

👉 Start with:
STEP 1 → Server setup

---

When done, come back and say:

👉 **“Step 1 done”**

I’ll guide you like a mentor to next step 🔥
