import express from 'express';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import emailService from '../services/emailService.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// ================================
// RATE LIMITING FOR AUTH ROUTES
// ================================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  message: 'Too many login attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.ip === '127.0.0.1' || req.ip === 'localhost' || req.ip === '::1';
  }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 registrations per IP per hour
  message: 'Too many accounts created from this IP. Please try again later.',
  skip: (req) => {
    return req.ip === '127.0.0.1' || req.ip === 'localhost' || req.ip === '::1';
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRY = '7d';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware to check if MongoDB is connected
const checkMongoDB = (req, res, next) => {
  if (!global.mongoConnected) {
    return res.status(503).json({ 
      error: 'Registration system temporarily unavailable. Please try again later.' 
    });
  }
  next();
};

// Generate verification code (6 digits)
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate API Key
const generateApiKey = () => {
  return `sk_${uuidv4()}`.replace(/-/g, '');
};

// ================================
// 1. INITIAL REGISTRATION (email, DAW, OS)
// ================================
router.post('/register', registerLimiter, checkMongoDB, async (req, res) => {
  try {
    const { email, daw, operatingSystem } = req.body;

    // Validate input
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    if (!daw) {
      return res.status(400).json({ error: 'DAW is required' });
    }

    if (!operatingSystem || !['Windows', 'MacOS'].includes(operatingSystem)) {
      return res.status(400).json({ error: 'Valid operating system is required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      if (existingUser.emailVerified) {
        return res.status(400).json({ error: 'Email already registered. Please log in.' });
      }
      // If user exists but not verified, send new code
      const verificationCode = generateVerificationCode();
      const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');
      
      existingUser.emailVerificationToken = hashedCode;
      existingUser.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      existingUser.daw = daw;
      existingUser.operatingSystem = operatingSystem;
      await existingUser.save();

      // Send verification email
      const verificationLink = `${FRONTEND_URL}/verify?code=${verificationCode}&email=${email}`;
      await emailService.sendVerificationEmail(email, verificationCode, verificationLink);

      return res.status(200).json({
        status: 'pending-verification',
        message: 'Verification code sent to your email',
        email: email
      });
    }

    // Create new user
    const verificationCode = generateVerificationCode();
    const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');

    const newUser = new User({
      email: email.toLowerCase(),
      password: generateApiKey(), // Temporary password, will be replaced
      daw,
      operatingSystem,
      emailVerificationToken: hashedCode,
      emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      registrationStatus: 'pending'
    });

    await newUser.save();

    // Send verification email
    const verificationLink = `${FRONTEND_URL}/verify?code=${verificationCode}&email=${email}`;
    const emailResult = await emailService.sendVerificationEmail(email, verificationCode, verificationLink);

    res.status(201).json({
      status: 'pending-verification',
      message: 'Verification code sent to your email',
      email: email,
      previewUrl: emailResult.previewUrl || undefined // For testing
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// ================================
// 2. EMAIL VERIFICATION
// ================================
router.post('/verify-email', checkMongoDB, async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    const user = await User.findOne({
      email: email.toLowerCase(),
      emailVerificationToken: hashedCode,
      emailVerificationExpiry: { $gt: new Date() }
    }).select('+emailVerificationToken +emailVerificationExpiry');

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.registrationStatus = 'email-verified';
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    res.json({
      status: 'email-verified',
      message: 'Email verified successfully',
      email: user.email,
      daw: user.daw,
      operatingSystem: user.operatingSystem
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: error.message || 'Verification failed' });
  }
});

// ================================
// 3. COMPLETE REGISTRATION (nick, name, country)
// ================================
router.post('/complete-registration', checkMongoDB, async (req, res) => {
  try {
    const { email, nick, firstName, lastName, country, password } = req.body;

    if (!email || !nick || !firstName || !lastName || !country) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate nick
    if (nick.length < 3 || nick.length > 20) {
      return res.status(400).json({ error: 'Nick must be 3-20 characters' });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(nick)) {
      return res.status(400).json({ error: 'Nick can only contain letters, numbers, underscores, and hyphens' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.emailVerified) {
      return res.status(400).json({ error: 'Please verify your email first' });
    }

    // Check if nick is unique
    const existingNick = await User.findOne({ nick });
    if (existingNick && existingNick._id.toString() !== user._id.toString()) {
      return res.status(400).json({ error: 'Nick is already taken' });
    }

    // Update user
    user.nick = nick;
    user.firstName = firstName;
    user.lastName = lastName;
    user.country = country;
    
    // Set password (at least 8 characters)
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    user.password = password;

    // Generate API Key
    user.apiKey = generateApiKey();
    user.registrationStatus = 'completed';

    await user.save();

    // Send welcome email
    await emailService.sendWelcomeEmail(email, nick, user.apiKey);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, nick: user.nick },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.json({
      status: 'registration-complete',
      message: 'Registration completed successfully',
      token,
      user: {
        _id: user._id,
        email: user.email,
        nick: user.nick,
        firstName: user.firstName,
        lastName: user.lastName,
        country: user.country,
        operatingSystem: user.operatingSystem,
        daw: user.daw,
        apiKey: user.apiKey
      }
    });

  } catch (error) {
    console.error('Complete registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// ================================
// 4. LOGIN
// ================================
router.post('/login', checkMongoDB, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +apiKey');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.emailVerified) {
      return res.status(400).json({ error: 'Please verify your email first' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, nick: user.nick },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.json({
      status: 'logged-in',
      token,
      user: {
        _id: user._id,
        email: user.email,
        nick: user.nick,
        firstName: user.firstName,
        lastName: user.lastName,
        country: user.country,
        operatingSystem: user.operatingSystem,
        daw: user.daw,
        apiKey: user.apiKey
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// ================================
// 5. GET PROFILE (protected)
// ================================
router.get('/profile', verifyToken, checkMongoDB, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('+apiKey');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        nick: user.nick,
        firstName: user.firstName,
        lastName: user.lastName,
        country: user.country,
        operatingSystem: user.operatingSystem,
        daw: user.daw,
        apiKey: user.apiKey,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch profile' });
  }
});

// ================================
// 6. SIMPLE REGISTRATION (for plugin - email + password only)
// ================================
router.post('/simple-register', registerLimiter, checkMongoDB, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      password,
      emailVerified: true, // Auto-verify for plugin users
      registrationStatus: 'completed',
      nick: email.split('@')[0] // Auto-generate nick from email
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.status(201).json({
      status: 'success',
      message: 'Registration completed',
      token,
      user: {
        _id: newUser._id,
        email: newUser.email,
        nick: newUser.nick
      }
    });

  } catch (error) {
    console.error('Simple registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// ================================
// 7. SIMPLE LOGIN (for plugin - email + password)
// ================================
router.post('/simple-login', loginLimiter, checkMongoDB, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.json({
      status: 'success',
      token,
      user: {
        _id: user._id,
        email: user.email,
        nick: user.nick
      }
    });

  } catch (error) {
    console.error('Simple login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// ================================
// 7. SIMPLE LOGIN DEV (without MongoDB check - for testing)
// ================================
router.post('/simple-login-dev', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // If MongoDB is connected, use it
    if (global.mongoConnected) {
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );

      return res.json({
        status: 'success',
        token,
        user: {
          _id: user._id,
          email: user.email,
          nick: user.nick
        }
      });
    }

    // Fallback: For development, accept any email/password combo with 8+ characters
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Generate a mock user response (for development testing)
    const mockUserId = crypto.createHash('md5').update(email).digest('hex');
    const token = jwt.sign(
      { userId: mockUserId, email: email.toLowerCase() },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.json({
      status: 'success',
      token,
      user: {
        _id: mockUserId,
        email: email.toLowerCase(),
        nick: email.split('@')[0]
      }
    });

  } catch (error) {
    console.error('Simple login dev error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// ================================
// 8. RESET PASSWORD DEV (for testing)
// ================================
router.post('/reset-password-dev', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // If MongoDB is connected, update in database
    if (global.mongoConnected) {
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Hash and update password
      user.password = newPassword;
      await user.save();

      return res.json({
        status: 'success',
        message: 'Password updated successfully',
        email: user.email
      });
    }

    // Fallback: For development without MongoDB, just return success
    // In production, you would send a reset link via email
    res.json({
      status: 'success',
      message: 'Password reset email sent (dev mode)',
      email: email.toLowerCase()
    });

  } catch (error) {
    console.error('Reset password dev error:', error);
    res.status(500).json({ error: error.message || 'Reset failed' });
  }
});

export default router;

