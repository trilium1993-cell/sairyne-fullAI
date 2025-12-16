import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { getMongoClient } from '../_lib/mongo.js';

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  const b = req?.body;
  if (!b) return {};
  if (typeof b === 'string') {
    try {
      return JSON.parse(b);
    } catch {
      return {};
    }
  }
  return b;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { email, password } = parseBody(req);

    if (!email || !validator.isEmail(String(email))) {
      return sendJson(res, 400, { error: 'Valid email is required' });
    }
    if (!password || String(password).length < 8) {
      return sendJson(res, 400, { error: 'Password must be at least 8 characters' });
    }

    const client = await getMongoClient();
    const db = client.db('sairynereg');
    const users = db.collection('users');

    const user = await users.findOne({ email: String(email).toLowerCase() });
    if (!user || !user.password) {
      return sendJson(res, 401, { error: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(String(password), String(user.password));
    if (!ok) {
      return sendJson(res, 401, { error: 'Invalid email or password' });
    }

    const secret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    const token = jwt.sign({ userId: String(user._id), email: String(user.email) }, secret, { expiresIn: '7d' });

    return sendJson(res, 200, {
      status: 'success',
      token,
      user: { _id: String(user._id), email: user.email, nick: user.nick ?? null },
    });
  } catch (e) {
    return sendJson(res, 500, { error: e?.message || 'Login failed' });
  }
}


