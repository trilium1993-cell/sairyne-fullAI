import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();
const isDevelopment = process.env.NODE_ENV !== 'production';

// ============================================================================
// SECURITY: Rate Limiting (simple in-memory implementation for MVP)
// For production with multiple instances, use Redis + express-rate-limit
// ============================================================================
const requestCounts = new Map(); // { ip: { count, resetTime } }
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // Per IP per minute

function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }
  
  const record = requestCounts.get(ip);
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT_WINDOW_MS;
    return next();
  }
  
  record.count++;
  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    if (isDevelopment) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${ip} (${record.count} requests)`);
    }
    return res.status(429).json({ 
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((record.resetTime - now) / 1000)
    });
  }
  
  next();
}

// Clean up rate limit records periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

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

// ============================================================================
// SECURITY: CORS Configuration
// Development: Allow localhost for testing
// Production: Strict whitelist of allowed origins
// ============================================================================
const corsOptions = {
  origin: (origin, callback) => {
    if (isDevelopment) {
      console.log('🌐 Incoming request Origin:', origin);
    }
    
    // Allow no-origin (JUCE plugin, internal requests, curl, Postman)
    // WebView in the plugin may not send an origin header
    if (!origin) {
      if (isDevelopment) {
        console.log('✅ No origin - allowing (plugin/internal/WebView)');
      }
      return callback(null, true);
    }
    
    // Check if origin is in allowedOrigins whitelist
    if (allowedOrigins.includes(origin)) {
      if (isDevelopment) {
        console.log(`✅ Origin allowed: ${origin}`);
      }
      return callback(null, true);
    }
    
    // Reject unknown origins
    if (isDevelopment) {
      console.warn(`⚠️ Origin blocked (not in whitelist): ${origin}`);
    } else {
      console.warn(`[SECURITY] CORS block: ${origin}`);
    }
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Sairyne-Client'],
  credentials: true,
  optionsSuccessStatus: 204
};

// ============================================================================
// SECURITY: Middleware Stack
// Order matters: CORS → Rate limiting → body parsing → routes
// ============================================================================
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Limit request body size to prevent abuse
app.use(express.json({ limit: '10kb' }));

// Apply rate limiting to all routes
app.use(rateLimitMiddleware);

// ============================================================================
// SECURITY: Request Validation Middleware
// Optionally validate X-Sairyne-Client header to identify plugin requests
// ============================================================================
function validateSairyneClient(req, res, next) {
  const clientHeader = req.headers['x-sairyne-client'];
  
  // Log the client identifier for security monitoring
  if (isDevelopment && clientHeader) {
    console.log(`[SECURITY] Request from client: ${clientHeader}`);
  }
  
  // We accept requests without this header (for backward compatibility and testing),
  // but we log it for monitoring purposes
  next();
}

app.use(validateSairyneClient);

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

// ============================================================================
// SECURITY: Input Validation & Cost Protection
// ============================================================================
const MAX_MESSAGE_LENGTH = 5000; // Characters
const MAX_CONVERSATION_HISTORY = 20; // Messages
const MAX_TOTAL_TOKENS_ESTIMATE = 4000; // Rough estimate for safety

function validateChatInput(message, conversationHistory) {
  const errors = [];
  
  // Validate message
  if (!message || typeof message !== 'string') {
    errors.push('Message must be a non-empty string');
  } else if (message.trim().length === 0) {
    errors.push('Message cannot be empty or whitespace only');
  } else if (message.length > MAX_MESSAGE_LENGTH) {
    errors.push(`Message exceeds max length of ${MAX_MESSAGE_LENGTH} characters`);
  }
  
  // Validate conversation history
  if (!Array.isArray(conversationHistory)) {
    errors.push('Conversation history must be an array');
  } else if (conversationHistory.length > MAX_CONVERSATION_HISTORY) {
    errors.push(`Conversation history exceeds max length of ${MAX_CONVERSATION_HISTORY} messages`);
  } else {
    // Validate each message in history
    for (let i = 0; i < conversationHistory.length; i++) {
      const msg = conversationHistory[i];
      if (!msg.type || !['user', 'ai'].includes(msg.type)) {
        errors.push(`Message ${i}: invalid type (must be 'user' or 'ai')`);
      }
      if (!msg.content || typeof msg.content !== 'string') {
        errors.push(`Message ${i}: content must be a non-empty string`);
      }
      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        errors.push(`Message ${i}: content exceeds max length`);
      }
    }
  }
  
  return errors;
}

// Estimate tokens (rough approximation: 1 token ≈ 4 characters)
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

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

// ============================================================================
// Chat Endpoint with Security: Input validation, cost protection, error handling
// ============================================================================
app.post('/api/chat/message', async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9); // For logging
  
  try {
    const { message, conversationHistory = [] } = req.body;
    
    // SECURITY: Validate input
    const validationErrors = validateChatInput(message, conversationHistory);
    if (validationErrors.length > 0) {
      if (isDevelopment) {
        console.warn(`[${requestId}] Validation errors:`, validationErrors);
      }
      return res.status(400).json({ 
        error: 'Invalid request',
        details: validationErrors[0] // Return first error to user
      });
    }

    if (!openai) {
      return res.status(503).json({ 
        error: 'AI service temporarily unavailable. Please configure OPENAI_API_KEY.' 
      });
    }

    // SECURITY: Estimate tokens before calling API
    const messageTokens = estimateTokens(message);
    const historyTokens = conversationHistory.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
    const systemTokens = estimateTokens(SYSTEM_PROMPT);
    const totalEstimatedTokens = messageTokens + historyTokens + systemTokens + 300; // +300 for response
    
    if (totalEstimatedTokens > MAX_TOTAL_TOKENS_ESTIMATE) {
      if (isDevelopment) {
        console.warn(`[${requestId}] Token estimate (${totalEstimatedTokens}) exceeds max (${MAX_TOTAL_TOKENS_ESTIMATE})`);
      }
      return res.status(400).json({ 
        error: 'Request is too large. Please shorten your message or clear conversation history.' 
      });
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

    if (isDevelopment) {
      console.log(`[${requestId}] ChatGPT request: ${messageTokens} + ${historyTokens} history + ${systemTokens} system ≈ ${totalEstimatedTokens} tokens`);
    }

    // SECURITY: Call OpenAI API with cost awareness
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      temperature: 0.7,
      max_tokens: 300
    });

    const aiResponse = completion.choices[0].message.content;

    if (isDevelopment) {
      console.log(`[${requestId}] ✅ ChatGPT response: ${estimateTokens(aiResponse)} tokens`);
    }

    res.json({
      response: aiResponse,
      timestamp: Date.now()
    });

  } catch (error) {
    // SECURITY: Log with context but never expose internal details to production clients
    const isOpenAIError = error.status !== undefined;
    
    if (isDevelopment) {
      console.error(`[${requestId}] Error:`, {
        type: error.type || 'unknown',
        status: error.status || 'N/A',
        code: error.code || 'N/A',
        message: error.message
      });
    } else {
      // Production: Log just the essentials
      console.error(`[${requestId}] [SECURITY] Chat API error:`, {
        type: isOpenAIError ? 'openai' : 'internal',
        status: error.status || 500
      });
    }
    
    // SECURITY: Return appropriate error response without exposing internals
    if (error.status === 401) {
      return res.status(503).json({ 
        error: 'AI service is not properly configured. Please try again later.' 
      });
    }
    
    if (error.status === 429) {
      return res.status(429).json({ 
        error: 'OpenAI service is temporarily busy. Please try again in a moment.' 
      });
    }

    if (error.status === 500) {
      return res.status(503).json({ 
        error: 'OpenAI service is temporarily unavailable. Please try again later.' 
      });
    }

    // Generic error for anything else
    res.status(500).json({ 
      error: 'Failed to generate response. Please try again or contact support.' 
    });
  }
});

// ============================================================================
// SECURITY: Global Error Handler & Logging
// Catches any unhandled errors and prevents stack traces from leaking
// ============================================================================
app.use((err, req, res, next) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  
  if (isDevelopment) {
    console.error(`[${requestId}] Unhandled error:`, err);
  } else {
    console.error(`[${requestId}] [SECURITY] Unhandled error occurred`);
  }
  
  // Never expose internal error details to clients in production
  res.status(500).json({
    error: 'Internal server error',
    requestId: isDevelopment ? requestId : undefined
  });
});

// ============================================================================
// SECURITY: Server Startup Checks
// Verify that critical security settings are in place
// ============================================================================
app.listen(PORT, () => {
  if (isDevelopment) {
    console.log(`\n🚀 Backend server running on port ${PORT}`);
    console.log(`✅ CORS mode: ${isDevelopment ? 'DEVELOPMENT (strict whitelist)' : 'PRODUCTION'}`);
    console.log(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);
    console.log(`✅ Rate limiting: ${RATE_LIMIT_MAX_REQUESTS} requests per ${RATE_LIMIT_WINDOW_MS / 1000}s per IP`);
    console.log(`✅ Body size limit: 10KB`);
    console.log(`✅ OpenAI API key: ${openaiApiKey ? 'Configured ✅' : 'Missing ❌'}`);
    console.log(`✅ Max message length: ${MAX_MESSAGE_LENGTH} chars`);
    console.log(`✅ Max conversation history: ${MAX_CONVERSATION_HISTORY} messages\n`);
  } else {
    // Production startup
    console.log(`[STARTUP] Server running on port ${PORT}`);
    console.log(`[SECURITY] CORS enabled for ${allowedOrigins.length} origins`);
    console.log(`[SECURITY] Rate limiting active: ${RATE_LIMIT_MAX_REQUESTS} req/${RATE_LIMIT_WINDOW_MS / 1000}s`);
    if (!openaiApiKey) {
      console.error('[CRITICAL] OPENAI_API_KEY not set - AI features will fail');
    }
  }
});

