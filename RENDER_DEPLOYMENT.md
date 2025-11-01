# Render Deployment Guide

## 🚀 Deploy Backend to Render.com

### Step 1: Create Account
1. Go to https://render.com
2. Sign up with GitHub
3. Connect your GitHub account

### Step 2: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Select repository: `trilium1993-cell/sairyne-fullAI`
3. Click **"Connect"**

### Step 3: Configure Settings

**Name:** `sairyne-backend` (or any name)

**Region:** Choose closest to you

**Branch:** `main`

**Root Directory:** `backend`

**Runtime:** `Node`

**Build Command:** `npm install`

**Start Command:** `npm start`

### Step 4: Add Environment Variables

Click **"Add Environment Variable"**:

| Key | Value |
|-----|-------|
| `OPENAI_API_KEY` | `sk-...твой_ключ` |
| `PORT` | `10000` (Render default, optional) |
| `CORS_ORIGIN` | `https://sairyne-full-ai-ujun.vercel.app` |

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (3-5 minutes)
3. Render will give you a URL like: `https://sairyne-backend.onrender.com`

### Step 6: Update Vercel Frontend

Go to Vercel → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://твой-backend.onrender.com` |

Then **Redeploy** frontend.

---

## ✅ Verification

Test backend:
```bash
curl https://твой-backend.onrender.com/api/health
```

Should return:
```json
{"status":"ok","message":"Backend is running"}
```

Test AI chat:
```bash
curl -X POST https://твой-backend.onrender.com/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

---

## 🆓 Free Tier Limits

- 750 hours/month free compute
- Sleeps after 15 min inactivity (wakes up on request)
- First wake up takes ~30 seconds

---

## 🔍 Troubleshooting

**Service not starting:**
- Check Render logs
- Verify Root Directory is `backend`
- Verify Start Command is `npm start`

**OpenAI not working:**
- Check `OPENAI_API_KEY` is set correctly
- Check Render logs for errors
- Verify API key starts with `sk-`

