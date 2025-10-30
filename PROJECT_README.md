# 🎵 Sairyne - AI-Powered Music Production Assistant

[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-teal.svg)](https://tailwindcss.com/)

Sairyne is an interactive music production learning platform that guides users through creating House music in Ableton Live. Built with React, TypeScript, and integrated with JUCE for real-time audio analysis.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [JUCE Integration](#juce-integration)
- [Backend Integration](#backend-integration)
- [Contributing](#contributing)

---

## ✨ Features

### Current (MVP):
- ✅ **Interactive Chat Interface** - Step-by-step guidance for music production
- ✅ **Visual Tips System** - Context-aware visual guides for DAW operations
- ✅ **7-Step Learning Flow** - Complete House music production course
- ✅ **Responsive UI** - Optimized for plugin windows (383x847px)
- ✅ **JUCE Bridge** - Ready for audio engine integration

### Roadmap:
- 🔄 Real-time audio analysis via JUCE WebView
- 🔄 User progress tracking with backend API
- 🔄 Project file upload and analysis
- 🔄 AI-powered feedback on music production

---

## 🛠️ Tech Stack

### Frontend:
- **React 18.2** - UI framework
- **TypeScript** - Type safety
- **Vite 6.0** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing

### Backend (To be integrated):
- OpenAPI-compliant REST API
- User authentication
- Progress tracking
- File storage

### Audio Engine:
- **JUCE 8** - C++ audio framework
- **WebView Bridge** - JS ↔ C++ communication
- **FFT Analysis** - Real-time audio analysis on master channel

---

## 📂 Project Structure

```
SairyneSignIn/
├── src/
│   ├── components/          # React components
│   │   ├── VisualTips1/     # Step 1 visual tips (Tempo & Time Signature)
│   │   ├── VisualTips2/     # Step 2 visual tips (Drum Rack)
│   │   ├── FunctionalChat/  # Main chat interface
│   │   ├── ScreenManager.tsx # Navigation controller
│   │   └── ...
│   ├── screens/             # Full-screen views
│   │   ├── SignIn/
│   │   ├── LearnMode/
│   │   └── ...
│   ├── services/            # External integrations
│   │   └── audio/           # JUCE Bridge + Audio Engine
│   │       ├── juceBridge.ts    # JS ↔ C++ protocol
│   │       ├── audioEngine.ts   # Audio analysis logic
│   │       └── README.md        # JUCE integration docs
│   ├── hooks/               # Custom React hooks
│   │   ├── useJuceBridge.ts     # JUCE communication
│   │   └── useTypingAnimation.ts
│   ├── data/                # Static data
│   │   └── chatSteps.ts     # Chat flow definitions
│   ├── types/               # TypeScript types
│   │   ├── audio.ts         # Audio analysis types
│   │   └── ...
│   └── flow/                # Navigation flow
│       ├── steps.ts         # Step definitions
│       └── registry.tsx     # Component registry
├── public/                  # Static assets
│   └── img/                 # Images
├── dist/                    # Production build (generated)
├── BACKEND_INTEGRATION.md   # Backend API documentation
├── JUCE_INTEGRATION_CHECKLIST.md  # C++ integration guide
└── package.json             # Dependencies
```

---

## 🚀 Getting Started

### Prerequisites:
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn**

### Installation:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/sairyne.git
cd sairyne

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)

### Build for Production:

```bash
npm run build
```

Output will be in `/dist` folder.

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```bash
# API Configuration (when backend is ready)
VITE_API_BASE_URL=https://api.sairyne.com
VITE_API_KEY=your_api_key_here

# Environment
VITE_ENVIRONMENT=development  # development | production

# Feature Flags
VITE_ENABLE_JUCE=false        # Enable JUCE bridge
VITE_ENABLE_AUTH=false        # Enable authentication
```

**For local development, these are optional.**

---

## 🌐 Deployment

### Deploy to Vercel (Recommended):

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/sairyne.git
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repo
   - Vercel will auto-detect Vite
   - Click "Deploy"

3. **Environment Variables (Vercel Dashboard):**
   - Add your `.env` variables in Vercel settings
   - Redeploy if needed

### Alternative Platforms:
- **Netlify** - Similar to Vercel
- **GitHub Pages** - Free static hosting
- **Railway** - Full-stack deployments

---

## 🎵 JUCE Integration

### For C++ Developers:

The frontend is **ready to be embedded** in a JUCE VST3/AU plugin via WebView.

**Key Files:**
- `src/services/audio/juceBridge.ts` - JS ↔ C++ protocol
- `JUCE_INTEGRATION_CHECKLIST.md` - Complete integration guide
- `/dist/index.html` - Entry point for WebView

**Quick Start:**
```cpp
// In your JUCE PluginEditor
webView = std::make_unique<juce::WebBrowserComponent>();
webView->goToURL("file:///path/to/dist/index.html");
```

See `JUCE_INTEGRATION_CHECKLIST.md` for full implementation.

---

## 🔌 Backend Integration

### For Backend Developers:

**Documentation:** `BACKEND_INTEGRATION.md`

**API Endpoints needed:**
- `POST /api/auth/login` - User authentication
- `GET /api/progress` - User progress
- `POST /api/progress/step` - Save step completion
- `GET /api/tips/{stepId}` - Visual tips content
- `POST /api/chat/message` - Chat messages

**Recommended Stack:**
- Node.js + Express + TypeScript
- PostgreSQL or MongoDB
- JWT authentication
- OpenAPI 3.0 spec

---

## 📊 Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| Frontend UI | ✅ Complete | 7 steps implemented |
| Visual Tips (Steps 1-2) | ✅ Complete | Content ready |
| Chat Flow | ✅ Complete | All 7 steps defined |
| JUCE Bridge | ✅ Ready | Awaiting C++ integration |
| Backend API | ⏳ Not started | Documentation ready |
| User Auth | ⏳ Planned | JWT recommended |
| Analytics | ⏳ Planned | Track user progress |

---

## 🧪 Testing

Currently, tests are not implemented. **TODO:**
- Unit tests (Vitest)
- Component tests (React Testing Library)
- E2E tests (Playwright)

---

## 🤝 Contributing

### Development Workflow:

1. Create a feature branch
   ```bash
   git checkout -b feature/your-feature
   ```

2. Make your changes
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

3. Push and create PR
   ```bash
   git push origin feature/your-feature
   ```

### Coding Standards:
- Use TypeScript for type safety
- Follow existing code structure
- Add comments for complex logic
- Test before pushing

---

## 📝 License

This project is proprietary. All rights reserved.

---

## 📞 Contact & Support

- **Issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/sairyne/issues)
- **Documentation:** See `/docs` folder
- **JUCE Integration:** `JUCE_INTEGRATION_CHECKLIST.md`
- **Backend API:** `BACKEND_INTEGRATION.md`

---

## 🎯 Roadmap

### Phase 1 (Current - MVP):
- [x] Frontend UI
- [x] Chat flow (7 steps)
- [x] Visual tips (Steps 1-2)
- [x] JUCE bridge protocol

### Phase 2 (Next):
- [ ] Backend API implementation
- [ ] User authentication
- [ ] Progress tracking
- [ ] JUCE plugin integration

### Phase 3 (Future):
- [ ] Real-time audio analysis
- [ ] AI-powered feedback
- [ ] Multi-language support
- [ ] Mobile app

---

## 🙏 Acknowledgments

- Built with [Anima](https://animaapp.com) for Figma → Code conversion
- Powered by [JUCE](https://juce.com) for audio processing
- UI framework: [React](https://reactjs.org)

---

**Made with ❤️ for music producers**

