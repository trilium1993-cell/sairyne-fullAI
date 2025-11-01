# How to Add Environment Variables on Render

## 🎯 Step-by-Step:

### 1. Go to your Render Dashboard
- Open https://render.com/dashboard
- Find your **Web Service** (sairyne-backend or similar)

### 2. Click on your Web Service
- You'll see a page with tabs at the top

### 3. Look for these tabs:
```
Events | Logs | Settings | Metrics | Shell
```

### 4. Click **"Settings"** tab

### 5. Scroll down to **"Environment"** section

### 6. Click **"Add Environment Variable"** button

### 7. Add these variables:

| Key | Value |
|-----|-------|
| `OPENAI_API_KEY` | `sk-proj-твой_ключ` |
| `CORS_ORIGIN` | `https://sairyne-full-ai-ujun.vercel.app` |

### 8. Click **"Save Changes"**

### 9. Render will automatically redeploy your service

---

## 🔍 If you don't see "Settings" tab:

Make sure you're looking at the **Web Service** page, not the Project overview page.

---

## ⚠️ Important:

- **DO NOT** add `OPENAI_API_KEY=` prefix in the value field
- Just the key itself: `sk-proj-...`
- After adding, wait 2-3 minutes for redeploy

