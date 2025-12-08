# 🎵 Sairyne - AI Music Production Assistant

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/sairyne)

Interactive music production learning platform with AI-powered guidance for creating House music in Ableton Live.

**Live Demo:** [https://sairyne-full-ai-ujun.vercel.app](https://sairyne-full-ai-ujun.vercel.app)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Visit [http://localhost:5173](http://localhost:5173)

---

## 📚 Documentation

### For Developers
- **[Full Project Documentation](./PROJECT_README.md)** - Complete guide
- **[Backend Integration](./BACKEND_INTEGRATION.md)** - API documentation
- **[JUCE Integration](./JUCE_INTEGRATION_CHECKLIST.md)** - Audio engine guide

### For Backend Team
- **[Backend Specification (MVP)](./BACKEND_SPEC_MVP.md)** - Complete API spec with OpenAI integration
- **[Frontend Changes](./FRONTEND_CHANGES.md)** - Required frontend modifications
- **[AI Prompts](./AI_PROMPTS.md)** - OpenAI prompt engineering guide

### For Audio Engineer
- **[JUCE Plugin Spec (Phase 1)](./JUCE_PLUGIN_SPEC_PHASE1.md)** - WebView plugin implementation guide
- **[JUCE Integration Checklist](./JUCE_INTEGRATION_CHECKLIST.md)** - FFT audio engine integration (Phase 2)

---

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite 6.0
- Tailwind CSS

### Backend
- Node.js + Express
- OpenAI GPT-4 API
- Deployed on Render.com

### Plugin
- JUCE 8 (Audio Engine + WebView wrapper)

---

## 📂 Project Structure

```
src/
├── components/     # React components
├── screens/        # Full-screen views
├── services/       # External integrations (JUCE, API)
├── hooks/          # Custom React hooks
└── data/           # Static data
```

---

## 🌐 Deployment

### Frontend (Vercel)
1. **Push to GitHub**
2. **Import to Vercel**
3. **Deploy automatically**

### Backend (Render)
1. Follow [Render Deployment Guide](./RENDER_DEPLOYMENT.md)
2. Set environment variables (OPENAI_API_KEY, CORS_ORIGIN)
3. Update VITE_API_URL on Vercel

[Deploy Now →](https://vercel.com/new)

---

## 📝 Environment Variables

Copy `env.example` to `.env.local` for local development:

```bash
# Frontend
VITE_API_URL=http://localhost:3001

# Backend (for backend team)
OPENAI_API_KEY=sk-...your-key-here
PORT=3001

# JUCE Plugin (for audio engineer)
JUCE_WEBVIEW_URL=http://localhost:5173
```

See `env.example` for complete configuration options.

---

## 🤝 Contributing

See [PROJECT_README.md](./PROJECT_README.md) for full contribution guidelines.

---

## 📄 License

Proprietary. All rights reserved.

---

## ⚖️ Legal

© 2025 ТОВ «Sairyne Tech». Усі права захищено.

© 2025 Sairyne Tech LLC. All rights reserved.

Sairyne and the Sairyne Assistant plugin are owned and developed by ТОВ «Sairyne Tech».

Sairyne Tech is the sole owner of all intellectual property related to this software, including the plugin code, branding, and AI-assisted workflows.

---

**Made with ❤️ for music producers**
