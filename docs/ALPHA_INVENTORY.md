# Sairyne ALPHA Release - Project Inventory

## Project Overview

**Sairyne** is an AI-powered VST3 plugin for music producers.
- **Status**: Functional macOS prototype, ALPHA release preparation
- **Windows**: Deferred (will be rewritten in native JUCE C++)
- **Target**: Music producers using Logic Pro / Ableton on macOS

---

## Frontend Architecture

### Entry Points

1. **Plugin UI (embedded in JUCE WebView)**
   - File: `embed-chat.html`
   - Loads: React app via `src/index.tsx`
   - Context: WKWebView on macOS, loads from `https://sairyne-ai.vercel.app/embed-chat.html`

2. **Web Landing Page**
   - File: `index.html` (root)
   - Purpose: Marketing, early access signup via Formspree

3. **Vanilla JS Fallbacks** (for Windows WebView2 compatibility, not critical now)
   - File: `visual-tips.html`, `chat-visual-tips-2.html`
   - Status: Legacy, not actively used for macOS alpha

### Main Components

- **ScreenManager.tsx**: Routes between screens (SignIn, Chat, Projects, Analysis, etc.)
- **FunctionalChat.tsx**: Main chat component with mode switching (Learn/Pro/Create)
- **ErrorBoundary.tsx**: Global error handler
- **MasterChannelNotice.tsx**: Notification about plugin placement

### Network & Services

**Key File**: `src/services/chatService.ts`
- Handles POST `/api/chat/message` to backend
- Handles GET `/api/health` for health checks
- **Current State**: Basic fetch, minimal error handling
- **Issue**: No timeout, no offline detection, no graceful degradation

**API Config**: `src/config/api.ts`
- `API_URL = https://sairyne-fullai-5.onrender.com` (production)
- Endpoints: `/api/chat/message`, `/api/health`

### Error Handling

- **ErrorBoundary.tsx**: Catches React errors, shows fallback UI
- **No**: Network timeout handler
- **No**: Offline/no-internet detection
- **No**: Backend-down graceful state

---

## Backend Architecture

**File**: `backend/src/server.js` (Express.js)

### Endpoints

```
GET  /api/health            - backend status check
POST /api/chat/message      - AI chat (requires OPENAI_API_KEY)
POST /analytics/event       - event tracking
```

### CORS Configuration

- **Mode**: DEBUG (open to all origins) `origin: true`
- **TODO**: Switch to strict allowlist for production
- **Allowed in render.yaml**:
  - `https://sairyne-ai.vercel.app`
  - `https://sairyne-full-ai.vercel.app`
  - `http://localhost:5173`
  - `http://localhost:3000`

### Deployment

- **Platform**: Render.com
- **Service**: `sairyne-fullai-5.onrender.com`
- **Environment**: Via `render.yaml`

---

## Legal / Compliance

**Current State**: ❌ None
- **Missing**: EULA
- **Missing**: Privacy Policy
- **Missing**: Terms of Service
- **Missing**: Feedback/Bug Report mechanism

---

## Network Error States (NOT IMPLEMENTED)

Current issues to address:

1. **No internet / Offline**
   - App will hang or show generic errors
   - No graceful offline state

2. **Weak connection / Timeout**
   - No timeout logic (requests can hang indefinitely)
   - No "retry" button

3. **Backend down (503)**
   - Open CORS shows raw error
   - No user-friendly message

4. **Network spike mid-request**
   - Request may fail silently
   - User doesn't know what happened

---

## Build & Deployment

### Frontend Build

- **Tool**: Vite
- **Output**: `dist/`
- **Deployment**: Vercel (`https://sairyne-ai.vercel.app`)
- **Entry**: `embed-chat.html` (for plugin)

### Backend Build

- **Tool**: Node.js / npm
- **Runtime**: Render.com
- **Env vars**: `OPENAI_API_KEY`, `CORS_ORIGINS`, `PORT`

---

## Existing Documentation

- `PROJECT_README.md`: High-level overview
- `JUCE_INTEGRATION_CHECKLIST.md`: JUCE/plugin specific notes
- `BACKEND_SPEC_MVP.md`: Backend spec

---

## Files to Create for ALPHA

1. **EULA.md** - End-User License Agreement
2. **docs/PRIVACY.md** - Privacy Policy placeholder
3. **src/utils/networkErrors.ts** - Network error handling utilities
4. **src/utils/offlineMode.ts** - Offline state detection & caching
5. **docs/ALPHA_CHECKLIST.md** - Test & release checklist

---

## Summary: What Needs Work for ALPHA

| Task | Status | File(s) |
|------|--------|---------|
| EULA | ❌ | New: `EULA.md` |
| Privacy Policy | ❌ | New: `docs/PRIVACY.md` |
| Feedback Button | ❌ | `src/components/UserMenu/` |
| Timeout Handler | ❌ | Modify: `chatService.ts` |
| Offline Detection | ❌ | New: `src/utils/offlineMode.ts` |
| Backend Down State | ❌ | Modify: `FunctionalChat.tsx` |
| Error Messages | ⚠️ Partial | Various components |
| Health Check Endpoint | ✅ | Already: `/api/health` |


