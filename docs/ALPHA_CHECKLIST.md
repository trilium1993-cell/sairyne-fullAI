# Sairyne ALPHA Release Checklist & Testing Guide

**Version 1.0 | Last Updated: December 2025**

---

## 🎯 ALPHA Release Readiness

This checklist ensures Sairyne is ready for early access / ALPHA release on macOS.

### ✅ Completed Features

- [x] Basic plugin UI (React frontend in WKWebView)
- [x] AI chat integration with OpenAI backend
- [x] Project/channel analysis workflow
- [x] Pro Mode / Learn Mode switching
- [x] Master Channel Notice
- [x] CORS configuration for localhost + production
- [x] Feedback collection form (Google Form)
- [x] Basic error boundary

### ⚠️ New Features for ALPHA

- [x] EULA & Legal Terms (EULA.md)
- [x] "Report a Bug" button with email template
- [x] Network timeout handling (15-30 second timeout)
- [x] Offline mode detection & graceful degradation
- [x] User-friendly error messages for network issues
- [x] Weak connection detection
- [x] Health check endpoint (`/api/health`)

---

## 📁 New / Modified Files for ALPHA

### New Files Created

```
EULA.md                               # End-User License Agreement
PRIVACY_POLICY.md                     # Privacy Policy & Cookie Policy & GDPR compliance
docs/ALPHA_INVENTORY.md              # Project structure & technical overview
docs/ALPHA_CHECKLIST.md              # This file
src/utils/networkErrors.ts           # Network error classification & timeout utilities
src/utils/offlineMode.ts             # Offline detection & state management
```

### Modified Files

```
src/services/chatService.ts          # Added timeout, error handling, offline support
src/components/UserMenu/UserMenu.tsx # Added "Report a bug" button, EULA modal
render.yaml                           # Environment variables with CORS list
backend/src/server.js                # CORS debug mode (open to all origins)
```

---

## 🧪 Manual Testing Scenarios

### 1️⃣ Normal Operation (No Network Issues)

**Scenario**: User sends a message in the chat

**Steps**:
1. Open plugin in Logic Pro / Ableton
2. Sign in with test account
3. Send a message via the chat
4. Observe AI response

**Expected**: ✅ Message appears and AI responds within 10 seconds

**What to Check**:
- [ ] Message appears immediately
- [ ] Loading spinner shows while waiting
- [ ] AI response appears without errors
- [ ] No console errors

---

### 2️⃣ Slow Internet / Timeout Scenario

**Scenario**: Simulate slow network

**How to Simulate**:
- On macOS: Safari → Develop → Throttle Network
- Or use Charles Proxy / Fiddler to throttle requests

**Steps**:
1. Enable network throttling (2G or slow 4G)
2. Send a message
3. Wait for timeout (should be ~15-30 seconds)
4. Observe error message

**Expected**: ✅ User sees "Connection seems slow" message + Retry button

**What to Check**:
- [ ] Message is NOT sent multiple times (debounced)
- [ ] Clear error message appears
- [ ] User can click "Retry"
- [ ] No hanging spinners

---

### 3️⃣ No Internet / Offline Scenario

**Scenario**: Network completely unavailable

**How to Simulate**:
- Turn OFF WiFi + cellular
- Or use Chrome DevTools → Offline mode

**Steps**:
1. Disconnect from internet
2. Try to send a message
3. Observe error / offline state

**Expected**: ✅ Clear offline message appears

**What to Check**:
- [ ] Message like "You appear to be offline" appears
- [ ] No hanging requests
- [ ] Plugin doesn't crash
- [ ] User can see previously loaded content

---

### 4️⃣ Backend Down / 503 Error

**Scenario**: Render backend is down

**How to Simulate**:
```bash
# Stop the backend on Render
# Or manually curl with wrong URL:
curl -X POST https://invalid-backend.com/api/chat/message
```

**Steps**:
1. Backend is unreachable or returns 503
2. User tries to send a message
3. Observe error state

**Expected**: ✅ User sees "Server temporarily unavailable" message

**What to Check**:
- [ ] Clear error message (not HTTP error code)
- [ ] "Try again" button available
- [ ] No spinning forever
- [ ] Console shows classified error (SERVER_ERROR, not undefined)

---

### 5️⃣ Feedback / Bug Report Button

**Scenario**: User submits feedback

**Steps**:
1. Click the ⚙️ (settings) icon in plugin
2. Click "Leave feedback"
3. Observe Google Form opens

**Steps**:
1. Click the ⚙️ icon
2. Click "Report a bug"
3. Observe email client opens

**Expected**: ✅ Either web form or email opens with template

**What to Check**:
- [ ] Feedback Google Form opens in browser
- [ ] Bug report email template is pre-filled with system info
- [ ] Email has proper subject & placeholder body
- [ ] Graceful handling if no email client (show fallback message)

---

### 6️⃣ EULA Modal

**Scenario**: User views legal terms

**Steps**:
1. Click ⚙️ icon
2. Click "EULA & Legal"
3. Read terms, then close

**Expected**: ✅ Modal appears and can be closed

**What to Check**:
- [ ] EULA text is readable (not too small)
- [ ] Scrollable content (doesn't overflow)
- [ ] Close button works
- [ ] Modal closes when clicking X
- [ ] Can reopen EULA multiple times

---

### 7️⃣ Weak Connection Detection

**Scenario**: Connection drops mid-request

**How to Simulate**:
- Start a message send
- Immediately disable WiFi (quick toggle)
- Re-enable WiFi

**Steps**:
1. Send message
2. Toggle WiFi OFF (1 second)
3. Toggle WiFi ON
4. Observe recovery

**Expected**: ✅ Plugin recovers, shows appropriate message

**What to Check**:
- [ ] Error message appears when connection drops
- [ ] Plugin recovers when connection returns
- [ ] No infinite retries
- [ ] State is consistent (message queue is correct)

---

## 🔧 Testing Checklist

### Before Release

- [ ] **Chat Functionality**
  - [ ] Can send message in Pro Mode
  - [ ] Can switch between Learn/Pro/Create modes
  - [ ] AI responds within reasonable time (< 30s)
  - [ ] Message history persists in session

- [ ] **Error Handling**
  - [ ] Timeout message appears after 15-30 seconds
  - [ ] Backend down shows user-friendly message
  - [ ] Offline message shows when no internet
  - [ ] Weak connection warning appears
  - [ ] No console errors logged in production

- [ ] **UI/UX**
  - [ ] All buttons are clickable and responsive
  - [ ] No layout breaking or overflow
  - [ ] Dark theme looks correct
  - [ ] Font sizes readable

- [ ] **Legal / Compliance**
  - [ ] EULA.md exists in repo root
  - [ ] EULA link accessible from plugin UI
  - [ ] "Report a bug" button works
  - [ ] Feedback form reachable

- [ ] **Network Configuration**
  - [ ] Backend CORS includes all needed origins
  - [ ] render.yaml has correct env vars
  - [ ] Frontend connects to correct backend URL
  - [ ] Health check endpoint responsive

- [ ] **Deployment**
  - [ ] Frontend built and deployed to Vercel
  - [ ] Backend deployed to Render
  - [ ] embed-chat.html entry point loads
  - [ ] No build errors or warnings

---

## 🚀 Release Checkoff

### Pre-Release Sign-Off

- [ ] All manual tests pass
- [ ] No critical errors in console
- [ ] EULA reviewed and approved
- [ ] Feedback mechanism tested
- [ ] Backend health check passes
- [ ] Frontend loads without CORS errors
- [ ] Plugin loads in Logic Pro / Ableton (macOS only)

### Notes for Users

When releasing to early access users, include:

1. **System Requirements**:
   - macOS 12+
   - Logic Pro 11.1+ or Ableton Live 12+
   - 100MB disk space
   - Internet connection required

2. **Known Limitations**:
   - ALPHA version (may have bugs)
   - AI features require OpenAI API
   - Occasional backend downtime possible
   - Windows version coming soon

3. **How to Report Bugs**:
   - Click ⚙️ → "Report a bug"
   - Or email trilium1993@gmail.com
   - Include DAW version, steps to reproduce

4. **Privacy & Support**:
   - Audio analysis sent to OpenAI servers
   - See OpenAI Privacy Policy
   - Backend may log usage data
   - Sairyne does not sell data
   - Contact: contact@sairyne.com

---

## 📊 Monitoring Post-Release

### Key Metrics to Track

- **Crash rate**: Monitor plugin crashes in Logic Pro / Ableton
- **Error frequency**: Count timeout / offline errors
- **Feedback submissions**: Track bug reports & feedback
- **API latency**: Monitor backend response times
- **Backend availability**: Track 500 errors & downtime

### How to Monitor

1. **Backend logs**: Render dashboard → Logs
2. **Error tracking**: Console errors in JUCE (check PluginEditor logs)
3. **User feedback**: Check trilium1993@gmail.com for bug reports
4. **API health**: Check `/api/health` endpoint regularly

---

## 🐛 Known Issues & TODOs

### Current (ALPHA)

- ⚠️ CORS is set to "open" (origin: true) for debugging. Should be restricted in production.
- ⚠️ No persistent error logging on client side
- ⚠️ Windows version uses vanilla JS (React doesn't work in WebView2)

### Future Improvements

- [ ] Add crash reporting (Sentry, etc.)
- [ ] Implement strict CORS whitelist
- [ ] Add rate limiting on frontend
- [ ] Persist error logs for debugging
- [ ] Add telemetry (with user consent)
- [ ] Create native UI in JUCE (C++) for Windows

---

## 📞 Support & Contact

**For bug reports & feedback**:
- 📧 Email: contact@sairyne.com
- 🎤 In-app: Click ⚙️ → "Report a bug" or "Leave feedback"
- 🌐 Website: https://www.sairyne.net
- 💼 Business inquiries: business@sairyne.com

**Emergency (backend down)**:
- Check https://dashboard.render.com/services/sairyne-fullai-5
- Manually restart service if needed

---

## 🎉 Release Notes Template

```markdown
# Sairyne Alpha Release v1.0

Welcome to Sairyne, an AI-powered assistant for music producers!

## What's New

- ✨ AI-powered channel analysis (Pro Mode)
- 📚 Interactive learning tutorial (Learn Mode)
- 💾 Project & channel memory
- 🎚️ Real-time audio analysis
- 🔧 Offline error handling

## System Requirements

- macOS 12 or later
- Logic Pro 11.1+ or Ableton Live 12+
- Internet connection

## How to Get Started

1. Install plugin
2. Open in your DAW
3. Click ⚙️ for settings & feedback

## Feedback

Found a bug? Have a feature request?
Click ⚙️ → "Report a bug" or "Leave feedback"

## Privacy

Your audio data is only used for AI analysis via OpenAI.
See our EULA (in-app) and Privacy Policy.

Enjoy! 🎵
```

---

**Last updated**: December 2025  
**Status**: Ready for ALPHA release ✅  
**Tested on**: macOS 13+, Logic Pro 11.1+, Ableton Live 12+

