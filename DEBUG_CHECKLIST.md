# 🐛 Debug Checklist: Backend Not Working on Render

## ✅ Current Status
- **Backend URL:** https://sairyne-fullai-5.onrender.com
- **Frontend URL:** https://sairyne-full-ai-ujun.vercel.app
- **Local backend:** ✅ Working (AI responds correctly)

## 🔍 What to Check

### 1. Render Environment Variables
On Render dashboard → Settings → Environment:
```
OPENAI_API_KEY = sk-...
CORS_ORIGIN = https://sairyne-full-ai-ujun.vercel.app
```

### 2. Vercel Environment Variables
On Vercel dashboard → Settings → Environment Variables:
```
VITE_API_URL = https://sairyne-fullai-5.onrender.com
```
☑️ Make sure it applies to **Production, Preview, Development**

### 3. Render Logs
After redeploy, check Render → Logs tab:
Should see:
```
🔍 Environment Check:
  OPENAI_API_KEY: ✅ SET
  CORS_ORIGIN: https://sairyne-full-ai-ujun.vercel.app
  PORT: 10000
🚀 Backend server running on port 10000
✅ CORS enabled for: https://sairyne-full-ai-ujun.vercel.app
```

### 4. Browser Console
Open https://sairyne-full-ai-ujun.vercel.app
Press F12 → Console
Look for errors:
- `Access-Control-Allow-Origin` → CORS issue
- `Failed to fetch` → Network issue
- `401 Unauthorized` → OpenAI key issue

## 🔧 Common Issues

### Issue 1: CORS Error
**Symptom:** Browser console shows `Access-Control-Allow-Origin`
**Fix:** Check `CORS_ORIGIN` on Render matches Vercel URL exactly

### Issue 2: OpenAI 401
**Symptom:** Render logs show "Invalid OpenAI API key"
**Fix:** 
1. Verify key on https://platform.openai.com/api-keys
2. Regenerate if needed
3. Update on Render (wait for redeploy)

### Issue 3: Frontend sends to wrong URL
**Symptom:** Browser Network tab shows requests to localhost:3001
**Fix:**
1. Check Vercel has `VITE_API_URL` set
2. Redeploy Vercel
3. Hard refresh browser (Cmd+Shift+R)

### Issue 4: Render service sleeping
**Symptom:** First request takes 30+ seconds, then works
**Fix:** This is normal for free tier. Wait for wake-up.

## 📝 Test Commands

### Test Backend Health:
```bash
curl https://sairyne-fullai-5.onrender.com/api/health
```

### Test AI Chat:
```bash
curl -X POST https://sairyne-fullai-5.onrender.com/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

### Test from Browser Console (on Vercel site):
```javascript
fetch('https://sairyne-fullai-5.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

## 🎯 Next Steps
1. Share Render logs output
2. Share browser console errors
3. Share Network tab screenshot when clicking "Send" in Pro Mode

