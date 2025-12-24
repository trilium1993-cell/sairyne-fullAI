import { getMongoClient } from '../_lib/mongo.js';

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
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

function getClientIp(req) {
  const h = req?.headers || {};
  const xff = h['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) return xff.split(',')[0].trim();
  if (Array.isArray(xff) && xff.length > 0) return String(xff[0]).split(',')[0].trim();
  const xrip = h['x-real-ip'];
  if (typeof xrip === 'string' && xrip.length > 0) return xrip.trim();
  return null;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { name, payload, timestamp } = parseBody(req);
    if (!name || typeof name !== 'string') {
      return sendJson(res, 400, { error: 'name is required' });
    }

    const doc = {
      name,
      payload: payload && typeof payload === 'object' ? payload : {},
      ts: typeof timestamp === 'number' ? new Date(timestamp) : new Date(),
      receivedAt: new Date(),
      ip: getClientIp(req),
      ua: req?.headers?.['user-agent'] || null,
      vercel: {
        env: process.env.VERCEL_ENV || null,
        url: process.env.VERCEL_URL || null,
        gitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
        gitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
      },
    };

    const client = await getMongoClient();
    const dbName = process.env.MONGODB_DB || 'sairynereg';
    const db = client.db(dbName);
    await db.collection('events').insertOne(doc);

    return sendJson(res, 200, { ok: true });
  } catch (e) {
    return sendJson(res, 500, { error: e?.message || 'Track failed' });
  }
}


