# Backend Integration Guide for Sairyne MVP

## 📋 Overview
This document describes how to integrate the Sairyne frontend with a backend API (OpenAPI).

---

## 🔌 API Endpoints (To be implemented)

### 1. User Progress Tracking
**POST** `/api/progress/step`
```json
{
  "stepId": "string (e.g., 'step-4')",
  "stepName": "string (e.g., 'Project Setup')",
  "completed": boolean,
  "timestamp": "ISO 8601 datetime"
}
```

### 2. Visual Tips State
**GET** `/api/tips/{stepId}`
```json
{
  "stepId": "string",
  "content": {
    "title": "string",
    "sections": [
      {
        "id": "string",
        "heading": "string",
        "instructions": ["string"],
        "images": ["url"]
      }
    ]
  }
}
```

### 3. Chat Message History
**GET** `/api/chat/history`
```json
{
  "messages": [
    {
      "id": "string",
      "stepId": "string",
      "text": "string",
      "timestamp": "ISO 8601 datetime"
    }
  ]
}
```

**POST** `/api/chat/message`
```json
{
  "stepId": "string",
  "userInput": "string",
  "timestamp": "ISO 8601 datetime"
}
```

---

## 🗂️ Current Frontend Structure

### Key Components:
- **VisualTips1** → Step 1 of 7 (Project Setup: Tempo & Time Signature)
- **VisualTips2** → Step 2 of 7 (Kick Drum: Drum Rack setup)
- **FunctionalChat** → Main chat interface with step progression
- **ScreenManager** → Handles navigation between screens

### Data Flow:
```
User Action → FunctionalChat → 
  → currentStep updates → 
  → VisualTips component renders (VisualTips1 or VisualTips2) → 
  → Backend saves progress (future)
```

---

## 🎵 JUCE WebView Integration (Audio Engine)

### Folder Structure:
```
/audio-engine/        ← JUCE 8 WebView integration
/src/                 ← React frontend
```

### Communication Protocol (To be implemented):
**Frontend → JUCE:**
```javascript
window.webkit?.messageHandlers?.audioEngine?.postMessage({
  command: "playNote",
  note: 60,
  velocity: 100
});
```

**JUCE → Frontend:**
```javascript
window.addEventListener('message', (event) => {
  if (event.data.source === 'audioEngine') {
    console.log('Audio event:', event.data);
  }
});
```

---

## 🛠️ Environment Variables (To be added)

Create `.env` file in project root:
```bash
VITE_API_BASE_URL=https://api.sairyne.com
VITE_API_KEY=your_api_key_here
VITE_ENVIRONMENT=development
```

---

## 📦 Recommended Backend Stack

### Option 1: Node.js + Express
- Fast setup
- Easy OpenAPI integration
- TypeScript support

### Option 2: Python + FastAPI
- Auto-generated OpenAPI docs
- Built-in validation
- Excellent for ML integration (if needed)

### Option 3: Supabase
- Ready-made auth + database
- Real-time updates
- PostgreSQL backend
- REST + GraphQL APIs

---

## ✅ Pre-Integration Checklist

- [x] Frontend is stable and error-free
- [x] Components are isolated and modular
- [x] Visual Tips render correctly for Step 1 & 2
- [ ] Environment variables configured
- [ ] API endpoints defined in OpenAPI spec
- [ ] Authentication flow implemented
- [ ] Database schema designed
- [ ] JUCE WebView bridge tested
- [ ] Error handling and logging set up

---

## 🚀 Next Steps

1. **Define OpenAPI specification** (Swagger/OpenAPI 3.0)
2. **Set up backend server** (Node.js/FastAPI/Supabase)
3. **Implement authentication** (JWT or OAuth)
4. **Create database models** for user progress
5. **Test JUCE WebView communication**
6. **Deploy frontend to Vercel/Netlify**
7. **Deploy backend to Railway/Render/AWS**

---

## 📞 Contact & Support

For questions about integration, refer to:
- Frontend code: `/src/components/`
- Chat flow logic: `/src/components/FunctionalChat/`
- Visual Tips: `/src/components/VisualTips1/` and `/VisualTips2/`

**Project Status:** Ready for MVP backend integration ✅

