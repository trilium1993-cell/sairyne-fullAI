import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { getMongoClient } from '../_lib/mongo.js';

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  const b = req?.body;
  if (!b) return {};
  if (typeof b === 'string') {
    try { return JSON.parse(b); } catch { return {}; }
  }
  return b;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { email, password } = parseBody(req);
    if (!email || !validator.isEmail(String(email))) return sendJson(res, 400, { error: 'Valid email is required' });
    if (!password || String(password).length < 8) return sendJson(res, 400, { error: 'Password must be at least 8 characters' });

    const client = await getMongoClient();
    const db = client.db('sairynereg');
    const users = db.collection('users');
    const normalizedEmail = String(email).toLowerCase();
    const existing = await users.findOne({ email: normalizedEmail });
    if (existing) return sendJson(res, 400, { error: 'Email already registered' });

    const hash = await bcrypt.hash(String(password), 10);
    const nick = normalizedEmail.split('@')[0];
    const now = new Date();
    const result = await users.insertOne({
      email: normalizedEmail,
      password: hash,
      emailVerified: true,
      registrationStatus: 'completed',
      nick,
      createdAt: now,
      updatedAt: now,
    });

    const secret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    const token = jwt.sign({ userId: String(result.insertedId), email: normalizedEmail }, secret, { expiresIn: '7d' });

    return sendJson(res, 201, { status: 'success', message: 'Registration completed', token, user: { _id: String(result.insertedId), email: normalizedEmail, nick } });
  } catch (e) {
    return sendJson(res, 500, { error: e?.message || 'Registration failed' });
  }
}


