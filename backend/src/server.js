import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import emailService from './services/emailService.js';

// Load environment variables
dotenv.config();
const isDevelopment = process.env.NODE_ENV !== 'production';

if (isDevelopment) {
  console.log("🌀 Sairyne backend restarting — fresh CORS build");
}
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize email service
await emailService.initialize();

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

// DEBUG MODE: Fully open CORS for WebView2 debugging
// TODO: In production, switch to strict whitelist below
const corsOptions = {
  origin: true, // Allow ALL origins (for WebView2 testing)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 204
};

if (isDevelopment) {
  console.log('⚠️ CORS MODE: OPEN FOR DEBUG (all origins allowed)');
}

// STRICT MODE - uncomment in production
/*
const corsOptions = {
  origin: (origin, callback) => {
    if (isDevelopment) {
      console.log('🌐 Incoming request Origin:', origin);
    }
    // Allow no-origin (JUCE, curl, internal, Postman, WebView2)
    if (!origin) {
      console.log('✅ No origin - allowing (JUCE/WebView2/curl/internal)');
      return callback(null, true);
    }
    // Check if origin is in allowedOrigins
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ Origin allowed: ${origin}`);
      return callback(null, true);
    }
    if (isDevelopment) {
      console.warn(`⚠️ Origin blocked: ${origin}`);
    }
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 204
};
*/

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

// ================================
// REGISTRATION & AUTH ROUTES
// ================================
app.use('/api/auth', authRoutes);

// ================================
// MONGODB CONNECTION (Optional - for Registration system)
// ================================
let mongoConnected = false;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    // Only connect if MONGODB_URI is explicitly set
    if (!mongoUri) {
      console.log('⚠️  MONGODB_URI not set. Registration system disabled.');
      return false;
    }
    
    if (isDevelopment) {
      console.log(`📊 Connecting to MongoDB: ${mongoUri.replace(/:[^:]*@/, ':***@')}`);
    }
    
    await mongoose.connect(mongoUri, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      },
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
    });
    
    console.log('✅ MongoDB connected successfully');
    mongoConnected = true;
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.warn('⚠️  Registration system disabled. Chat API still available.');
    mongoConnected = false;
    return false;
  }
};

// Try to connect to MongoDB (non-blocking - won't crash if fails)
await connectDB();

// Export mongoConnected status to global for routes to access
global.mongoConnected = mongoConnected;

// Start server
app.listen(PORT, "127.0.0.1", () => {
  if (isDevelopment) {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);
    console.log(`🤖 OpenAI API key: ${openaiApiKey ? 'Configured ✅' : 'Missing ❌'}`);
    console.log(`📧 Email service: Configured ✅`);
    console.log(`🔐 Auth routes: /api/auth/register, /api/auth/verify-email, /api/auth/complete-registration, /api/auth/login`);
  }
});

