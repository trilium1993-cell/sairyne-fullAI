# Sairyne Backend

Backend server for Sairyne AI chat powered by OpenAI GPT-4.

## 🚀 Quick Start

### Local Development

```bash
npm install
npm run dev
```

Server will run on `http://localhost:3001`

### Railway Deployment

**Important:** Railway must be configured with:
- **Root Directory:** `backend` (NOT root!)
- **Start Command:** `npm start`
- **Node Version:** 20.x

### Environment Variables

Required variables in Railway:
```
OPENAI_API_KEY=sk-...your-openai-key
PORT=3001
CORS_ORIGIN=https://your-frontend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app
```

### Health Check

Test if backend is running:
```bash
curl https://your-backend.up.railway.app/api/health
```

## 📝 API Endpoints

- `GET /api/health` - Health check
- `POST /api/chat/message` - Send AI chat message
- `POST /analytics/event` - Record lightweight analytics event (fire and forget)

## 🤖 OpenAI Integration

Uses OpenAI GPT-4 model with specialized Ableton Live assistant prompts.

## ⚖️ Legal

© 2025 ТОВ «Sairyne Tech». Усі права захищено.

© 2025 Sairyne Tech LLC. All rights reserved.

Sairyne backend is part of Sairyne, owned and developed by ТОВ «Sairyne Tech».

