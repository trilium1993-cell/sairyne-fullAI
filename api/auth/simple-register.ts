import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { getMongoClient } from '../_lib/mongo';

function json(res: any, status: number, body: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !validator.isEmail(String(email))) {
      return json(res, 400, { error: 'Valid email is required' });
    }
    if (!password || String(password).length < 8) {
      return json(res, 400, { error: 'Password must be at least 8 characters' });
    }

    const client = await getMongoClient();
    const db = client.db('sairynereg');
    const users = db.collection('users');

    const normalizedEmail = String(email).toLowerCase();
    const existing = await users.findOne({ email: normalizedEmail });
    if (existing) {
      return json(res, 400, { error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(String(password), 10);
    const nick = normalizedEmail.split('@')[0];

    const now = new Date();
    const doc = {
      email: normalizedEmail,
      password: hash,
      emailVerified: true,
      registrationStatus: 'completed',
      nick,
      createdAt: now,
      updatedAt: now,
    };

    const result = await users.insertOne(doc as any);

    const secret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    const token = jwt.sign(
      { userId: String(result.insertedId), email: normalizedEmail },
      secret,
      { expiresIn: '7d' }
    );

    return json(res, 201, {
      status: 'success',
      message: 'Registration completed',
      token,
      user: {
        _id: String(result.insertedId),
        email: normalizedEmail,
        nick,
      },
    });
  } catch (e: any) {
    return json(res, 500, { error: e?.message || 'Registration failed' });
  }
}


