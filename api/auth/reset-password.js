import bcrypt from 'bcryptjs';
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
    const { email, newPassword } = parseBody(req);
    if (!email || !validator.isEmail(String(email))) {
      return sendJson(res, 400, { error: 'Valid email is required' });
    }
    if (!newPassword || String(newPassword).length < 8) {
      return sendJson(res, 400, { error: 'Password must be at least 8 characters' });
    }

    const client = await getMongoClient();
    const db = client.db('sairynereg');
    const users = db.collection('users');

    const normalizedEmail = String(email).toLowerCase();
    const user = await users.findOne({ email: normalizedEmail });
    if (!user) {
      return sendJson(res, 404, { error: 'User not found' });
    }

    const hash = await bcrypt.hash(String(newPassword), 10);
    await users.updateOne(
      { email: normalizedEmail },
      { $set: { password: hash, updatedAt: new Date() } }
    );

    return sendJson(res, 200, { status: 'success', message: 'Password updated successfully', email: normalizedEmail });
  } catch (e) {
    return sendJson(res, 500, { error: e?.message || 'Password reset failed' });
  }
}


