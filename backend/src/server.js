import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Debug: Log environment variables (remove in production)
console.log('🔍 Environment Check:');
console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ SET' : '❌ MISSING');
console.log('  CORS_ORIGIN:', process.env.CORS_ORIGIN || 'http://localhost:5173 (default)');
console.log('  PORT:', PORT);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Initialize OpenAI
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ CRITICAL: OPENAI_API_KEY environment variable is not set!');
  console.error('Please add OPENAI_API_KEY to your Railway environment variables.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Chat endpoint
app.post('/api/chat/message', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
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
    console.error('OpenAI API Error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type
    });
    
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
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`✅ CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  console.log(`🤖 OpenAI API key: ${process.env.OPENAI_API_KEY ? 'Configured ✅' : 'Missing ❌'}`);
});

