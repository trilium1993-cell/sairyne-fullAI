import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();
const isDevelopment = process.env.NODE_ENV !== 'production';

if (isDevelopment) {
  console.log("🌀 Sairyne backend restarting — fresh CORS build");
}
const app = express();
const PORT = process.env.PORT || 3000;

// Parse CORS_ORIGINS from environment variable or use defaults
const defaultOrigins = [
  'https://sairyne-ai.vercel.app',
  'https://www.sairyne-ai.vercel.app',
  'https://sairyne-full-ai.vercel.app',
  'https://www.sairyne-full-ai.vercel.app',
  'https://sairyne-full5.onrender.com',
  'https://sairyne-fullai-5.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173'
];

const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : defaultOrigins;

// Debug: Log environment variables (development only)
if (isDevelopment) {
  console.log('🔍 Environment Check:');
  console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ SET' : '❌ MISSING');
  console.log('  CORS_ORIGINS:', process.env.CORS_ORIGINS ? '✅ SET from env' : '❌ Using defaults');
  console.log('  PORT:', PORT);
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isDevelopment) {
      console.log('🌐 Incoming request Origin:', origin);
    }
    if (!origin) return callback(null, true); // Allow no-origin (JUCE, curl, internal)
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.CORS_ORIGIN && origin === process.env.CORS_ORIGIN) return callback(null, true);
    if (isDevelopment) {
      console.warn('❌ Blocked by CORS:', origin);
    }
    return callback(null, false); // Do not throw to avoid 500 on preflight
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Lightweight test endpoint
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', origin: req.headers.origin || 'none' });
});

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey && isDevelopment) {
  console.error('❌ CRITICAL: OPENAI_API_KEY environment variable is not set! AI responses will be disabled.');
}

const openai = openaiApiKey
  ? new OpenAI({ apiKey: openaiApiKey })
  : null;

// System prompt for Ableton expert
const SYSTEM_PROMPT = `You are an expert Ableton Live music production assistant specializing in House music. 
Your role is to provide clear, practical advice to help users create professional House tracks.

Guidelines:
- Give concise, actionable answers (2-4 sentences max)
- Focus on Ableton Live workflow and features
- Use simple language, avoid jargon when possible
- If asked about specific techniques (bass, drums, effects), provide step-by-step instructions
- Reference specific Ableton tools and shortcuts when relevant
- Stay positive and encouraging
- Always respond in the SAME LANGUAGE as the user's question (Russian, English, Spanish, etc.)

Topics you excel at:
- Drum programming and rhythm
- Basslines and sub-bass
- Synthesizers and sound design
- Effects (reverb, delay, compression, EQ)
- Arrangement and structure
- Mixing and mastering basics
- MIDI and audio recording
- Ableton-specific features (racks, groups, automation)`;

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, backend: 'ready' });
});

// Analytics endpoint (MVP stub)
app.post('/analytics/event', (req, res) => {
  const { name, payload = {}, timestamp } = req.body || {};
  if (isDevelopment) {
    console.log('📊 Analytics Event:', {
      name,
      receivedAt: new Date().toISOString(),
      timestamp,
      payload
    });
  }
  res.status(202).json({ status: 'accepted' });
});

// Chat endpoint
app.post('/api/chat/message', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!openai) {
      return res.status(503).json({ error: 'AI service temporarily unavailable. Please configure OPENAI_API_KEY.' });
    }

    // Build messages array for OpenAI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      temperature: 0.7,
      max_tokens: 300
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({
      response: aiResponse,
      timestamp: Date.now()
    });

  } catch (error) {
    if (isDevelopment) {
      console.error('OpenAI API Error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
        type: error.type
      });
    }
    
    if (error.status === 401) {
      return res.status(401).json({ error: 'Invalid OpenAI API key' });
    }
    
    if (error.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }

    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN'
    });
  }
});

// Start server
app.listen(PORT, () => {
  if (isDevelopment) {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);
    console.log(`🤖 OpenAI API key: ${openaiApiKey ? 'Configured ✅' : 'Missing ❌'}`);
  }
});

