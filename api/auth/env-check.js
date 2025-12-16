function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function safeMongoHost(uri) {
  try {
    const at = uri.split('@')[1] || '';
    return at.split('/')[0] || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const mongoUri = process.env.MONGODB_URI;

  return sendJson(res, 200, {
    ok: true,
    hasMongoUri: Boolean(mongoUri),
    mongoHost: mongoUri ? safeMongoHost(mongoUri) : null,
    vercelEnv: process.env.VERCEL_ENV || null, // production / preview / development
    vercelUrl: process.env.VERCEL_URL || null,
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    gitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
    now: new Date().toISOString(),
  });
}


