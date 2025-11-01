# 🚀 Backend Specification for Sairyne MVP

## 📋 Overview

This document provides complete backend specifications for integrating AI chat functionality into the Sairyne music production assistant.

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         FRONTEND (React + Vite)                 │
│  - Deployed on Vercel                           │
│  - Existing chat interface                      │
│  - Learn/Create/Pro modes                       │
└──────────────┬──────────────────────────────────┘
               │ HTTPS REST API
               ▼
┌─────────────────────────────────────────────────┐
│         BACKEND API (Node.js/Express)           │
│  - Hosted on Railway/Render/Vercel Functions    │
│  - REST API endpoints                           │
│  - OpenAI integration                           │
│  - Session management                           │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│         OpenAI GPT-4 API                        │
│  - AI-powered responses                         │
│  - Ableton Live expertise                       │
│  - Context-aware conversations                  │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Core Requirements

### MVP Scope
1. **Learn Mode**: Use existing guided tutorial (chatSteps.ts) - NO CHANGES
2. **Pro Mode**: Enable AI-powered free chat via OpenAI
3. **Same UI**: All chat happens in existing left panel
4. **No Visual Tips in Pro Mode**: Right panel remains unchanged

### Technical Constraints
- ✅ Do NOT modify existing frontend components unnecessarily
- ✅ Do NOT break Learn mode (Steps 1-7)
- ✅ Keep Visual Tips (VisualTips1, VisualTips2) intact
- ✅ Minimize changes to FunctionalChat.tsx

---

## 🛠️ Tech Stack Recommendations

### Backend
- **Framework**: Node.js + Express (or Next.js API routes)
- **Language**: TypeScript
- **Hosting**: Railway, Render, or Vercel Serverless Functions
- **Authentication**: JWT tokens (optional for MVP)
- **Database**: PostgreSQL or MongoDB (optional for MVP - can use localStorage)

### AI Integration
- **Provider**: OpenAI
- **Model**: GPT-4 Turbo (for quality) or GPT-3.5 Turbo (for cost)
- **API**: Official OpenAI SDK for Node.js

---

## 📡 API Endpoints

### Base URL
```
Production: https://api.sairyne.com
Development: http://localhost:3001
```

---

### 1. POST `/api/chat/message`

Main endpoint for all chat interactions (both Learn and Pro modes).

#### Request Body
```json
{
  "message": "How do I add a bass synth?",
  "mode": "pro",
  "userId": "user_123",
  "sessionId": "session_abc",
  "context": {
    "currentStep": null,
    "previousMessages": [
      {
        "role": "user",
        "content": "Hello"
      },
      {
        "role": "assistant",
        "content": "Hi! How can I help?"
      }
    ]
  }
}
```

#### Request Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | User's message |
| `mode` | `"learn"` \| `"pro"` | Yes | Current mode |
| `userId` | string | No | User identifier (for future) |
| `sessionId` | string | No | Session tracking |
| `context.currentStep` | number | No | Current step in Learn mode |
| `context.previousMessages` | array | No | Chat history (last 10 messages) |

#### Response (Learn Mode)
```json
{
  "success": true,
  "mode": "learn",
  "reply": "Great! You've set the tempo. Now let's add a Drum Rack...",
  "nextStep": 2,
  "showVisualTips": true,
  "visualTipsComponent": "VisualTips2"
}
```

#### Response (Pro Mode)
```json
{
  "success": true,
  "mode": "pro",
  "reply": "For a bass synth like Anyma's style, I recommend using Serum or Ableton's Wavetable. Here's how to get started:\n\n1. Add a new MIDI track\n2. Drag Serum or Wavetable onto the track\n3. Start with a sine wave...",
  "showVisualTips": false
}
```

#### Error Response
```json
{
  "success": false,
  "error": "OpenAI API error",
  "message": "Failed to generate response. Please try again."
}
```

---

### 2. GET `/api/health`

Health check endpoint.

#### Response
```json
{
  "status": "ok",
  "timestamp": "2025-10-30T12:00:00Z",
  "version": "1.0.0"
}
```

---

## 🤖 OpenAI Integration

### System Prompt for Pro Mode

Store this as a constant in your backend code:

```typescript
const SAIRYNE_SYSTEM_PROMPT = `You are Sairyne, an expert AI assistant for Ableton Live music production.

Your expertise includes:
- Ableton Live 11 and 12 interface, workflow, and features
- Music production techniques (sound design, mixing, mastering)
- Electronic music genres: House, Techno, Melodic Techno, Progressive House
- Popular artists' sound: Anyma, Tale of Us, Adriatique, ARTBAT
- Synthesizers: Serum, Vital, Massive, Ableton's Wavetable and Operator
- Effects processing, automation, and arrangement
- Music theory: harmony, rhythm, melody, structure

Your communication style:
- Concise and actionable (3-5 sentences per response)
- Encouraging and supportive tone
- Use step-by-step instructions when needed
- Avoid overwhelming beginners with too much detail at once
- Stay focused on Ableton Live and music production topics

Important rules:
1. If asked about non-music topics, politely redirect: "I'm here to help with Ableton and music production. How can I assist with that?"
2. For complex questions, break down into simple steps
3. Suggest practical actions the user can take immediately
4. Do NOT mention visual tips or screenshots (handled separately)
5. Keep responses under 200 words

Current context:
- User is using Ableton Live for House/Techno music production
- Assume intermediate knowledge unless user indicates otherwise`;
```

### OpenAI API Call Structure

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function getAIResponse(
  userMessage: string, 
  previousMessages: Array<{role: string, content: string}>
) {
  try {
    const messages = [
      { role: 'system', content: SAIRYNE_SYSTEM_PROMPT },
      ...previousMessages.slice(-10), // Last 10 messages for context
      { role: 'user', content: userMessage }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview', // or 'gpt-3.5-turbo' for lower cost
      messages: messages,
      temperature: 0.7,
      max_tokens: 300,
      top_p: 1,
      frequency_penalty: 0.3,
      presence_penalty: 0.3
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to generate AI response');
  }
}
```

### Cost Estimation

**GPT-4 Turbo:**
- Input: $0.01 per 1K tokens
- Output: $0.03 per 1K tokens
- Average conversation: ~500 tokens = $0.015 per exchange
- 1000 conversations = ~$15

**GPT-3.5 Turbo (cheaper alternative):**
- Input: $0.0005 per 1K tokens
- Output: $0.0015 per 1K tokens
- Average conversation: ~500 tokens = $0.001 per exchange
- 1000 conversations = ~$1

**Recommendation for MVP:** Start with GPT-3.5 Turbo, upgrade to GPT-4 later.

---

## 🗄️ Database Schema (Optional for MVP)

You can skip database for MVP and use `localStorage` on frontend. For production:

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  subscription_tier VARCHAR(50) DEFAULT 'free', -- 'free', 'pro'
  last_login TIMESTAMP
);
```

### Chat Sessions Table
```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  mode VARCHAR(20) NOT NULL, -- 'learn' or 'pro'
  started_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP DEFAULT NOW()
);
```

### Chat Messages Table
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id),
  role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Environment Variables

Create `.env` file in backend:

```bash
# OpenAI
OPENAI_API_KEY=sk-...your-key-here

# Server
PORT=3001
NODE_ENV=development

# CORS (allow frontend)
FRONTEND_URL=https://sairyne.vercel.app

# Database (optional)
DATABASE_URL=postgresql://user:pass@host:5432/sairyne

# JWT (optional)
JWT_SECRET=your-secret-key-here
```

---

## 📦 Backend File Structure

```
backend/
├── src/
│   ├── index.ts                 # Express app entry point
│   ├── routes/
│   │   └── chat.routes.ts       # Chat endpoints
│   ├── services/
│   │   ├── openai.service.ts    # OpenAI integration
│   │   └── chat.service.ts      # Chat logic (Learn vs Pro)
│   ├── utils/
│   │   └── prompts.ts           # System prompts
│   └── types/
│       └── chat.types.ts        # TypeScript interfaces
├── .env
├── package.json
└── tsconfig.json
```

---

## 🚀 Deployment Options

### Option 1: Railway (Recommended)
- ✅ Easy setup
- ✅ Auto-deploy from GitHub
- ✅ Generous free tier
- ✅ Built-in PostgreSQL

**Steps:**
1. Push backend code to GitHub
2. Connect Railway to repo
3. Add environment variables
4. Deploy automatically

### Option 2: Render
- ✅ Free tier available
- ✅ Auto-deploy from GitHub
- ✅ Simple setup

### Option 3: Vercel Serverless Functions
- ✅ Same host as frontend
- ✅ No separate deployment
- ❌ Limited execution time (10s)
- ❌ Cold starts

**Recommendation:** Use Railway for backend API (more reliable for AI calls).

---

## 🧪 Testing Strategy

### 1. Unit Tests
Test OpenAI service independently:
```typescript
describe('OpenAI Service', () => {
  it('should generate response for bass synth question', async () => {
    const response = await getAIResponse('How do I add a bass synth?', []);
    expect(response).toContain('synth');
    expect(response.length).toBeLessThan(1000);
  });
});
```

### 2. Integration Tests
Test full API flow:
```bash
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I add a kick drum?",
    "mode": "pro"
  }'
```

### 3. Load Testing
- Use Artillery or k6
- Test 100 concurrent users
- Monitor OpenAI rate limits

---

## 📊 Monitoring & Analytics

### Recommended Tools
- **Error Tracking**: Sentry
- **Logging**: Winston or Pino
- **Analytics**: Mixpanel or Amplitude

### Key Metrics to Track
1. API response time (target: <2s)
2. OpenAI API errors
3. Cost per conversation
4. User engagement (messages per session)
5. Mode usage (Learn vs Pro)

---

## 🔒 Security Considerations

### API Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: 'Too many requests, please try again later'
});

app.use('/api/chat', chatLimiter);
```

### CORS Configuration
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### Input Validation
```typescript
import { body, validationResult } from 'express-validator';

app.post('/api/chat/message',
  body('message').isString().isLength({ min: 1, max: 1000 }),
  body('mode').isIn(['learn', 'pro']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process request...
  }
);
```

---

## 🎯 MVP Checklist

### Backend Tasks
- [ ] Set up Express server with TypeScript
- [ ] Create `/api/chat/message` endpoint
- [ ] Integrate OpenAI API
- [ ] Implement Learn mode logic (return from chatSteps)
- [ ] Implement Pro mode logic (call OpenAI)
- [ ] Add error handling and logging
- [ ] Configure CORS for frontend
- [ ] Add rate limiting
- [ ] Deploy to Railway/Render
- [ ] Test with frontend

### Environment Setup
- [ ] Create OpenAI account and get API key
- [ ] Set up environment variables
- [ ] Configure deployment platform
- [ ] Test production deployment

### Documentation
- [ ] API documentation
- [ ] Deployment guide
- [ ] Cost monitoring setup

---

## 📞 Support & Questions

For questions about this specification, contact the project owner or refer to:
- OpenAI API Docs: https://platform.openai.com/docs
- Express.js: https://expressjs.com/
- Railway Docs: https://docs.railway.app/

---

**Version:** 1.0.0  
**Last Updated:** October 30, 2025  
**Status:** Ready for Implementation ✅

