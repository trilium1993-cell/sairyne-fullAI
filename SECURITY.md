# 🔒 Sairyne Security Model

This document outlines the security architecture and practices for the Sairyne project.

## Overview

Sairyne is a VST3 music production plugin that uses AI to analyze audio. The security model is designed to:

1. **Protect API keys and secrets** - Never exposed to the frontend or plugin
2. **Prevent API abuse** - Rate limiting and cost protection
3. **Harden the backend** - Input validation, error handling, secure logging
4. **Ensure plugin safety** - WebView isolation, no direct OpenAI access
5. **Maintain compliance** - GDPR-ready, no sensitive data in logs

---

## 1. Secret Management

### Secrets in Use

- **OPENAI_API_KEY** - Used only on backend, never exposed to frontend
- Database credentials (if added) - Only on backend
- JWT secrets (if added) - Only on backend

### Storage & Access

**✅ Correct:**
```javascript
// Backend: Read from environment variables
const openaiApiKey = process.env.OPENAI_API_KEY;
```

**❌ Never:**
```javascript
// Frontend: Never put secrets here
export const OPENAI_KEY = 'sk-...'; // WRONG!
```

### Environment Variables

All secrets are loaded via `dotenv` on backend startup:

```bash
# backend/.env (never commit)
OPENAI_API_KEY=sk-...
NODE_ENV=production
PORT=3000
```

**Configuration for Render (or any hosting):**
1. Set `OPENAI_API_KEY` in environment variables (not in config files)
2. Set `NODE_ENV=production` to enable strict error handling
3. Set `CORS_ORIGINS` to whitelist your production domains

### .gitignore Protection

The following files are protected and never committed:

```
.env              # Environment variables
.env.local        # Local dev overrides
.env.production   # Production-only vars
backend/.env      # Backend environment file
```

See `.gitignore` for the full list.

---

## 2. API Security

### CORS (Cross-Origin Resource Sharing)

**Production:** Strict whitelist of allowed origins
```javascript
// Only these origins can call the API:
- https://sairyne-ai.vercel.app (Vercel frontend)
- https://sairyne-fullai-5.onrender.com (Render backend)
- http://localhost:5173 (local dev)
```

**Plugin requests:** No Origin header (allowed via special handling)

**How to add a new origin:**
1. Set `CORS_ORIGINS` environment variable on Render:
   ```
   CORS_ORIGINS=https://your-domain.com,https://existing-domains...
   ```
2. Or add to `defaultOrigins` array for local testing

### Rate Limiting

Applied to all routes to prevent abuse:

```
Max: 100 requests per IP per minute
Returns: 429 (Too Many Requests) when exceeded
```

**Per-endpoint limits (future enhancement):**
- `/api/chat/message` - 10 requests per minute per IP (stricter for AI)
- `/api/health` - 60 requests per minute per IP (less strict)

### Input Validation

All API endpoints validate input before processing:

```javascript
// Chat endpoint validation:
✓ Message must be a string (max 5000 characters)
✓ Conversation history must be array (max 20 messages)
✓ No empty or whitespace-only messages
✓ No invalid message types
```

**Cost Protection:**
- Token estimate before calling OpenAI
- Rejects requests that exceed max token limit
- Prevents runaway API costs

---

## 3. Backend Hardening

### Request Size Limits

```javascript
// Body size limit: 10KB max
app.use(express.json({ limit: '10kb' }));
```

This prevents malicious actors from:
- Sending huge payloads to crash the server
- Exploiting memory leaks
- Conducting DDoS attacks

### Error Handling

**Development:** Full error details logged for debugging
```javascript
if (isDevelopment) {
  console.error('Full error:', error);
}
```

**Production:** Minimal error details (no stack traces)
```javascript
// Client receives:
{ error: 'Failed to generate response' }

// Server logs:
[SECURITY] Chat API error: { type: 'openai', status: 500 }
```

### Logging & Monitoring

Structured logging with context but NO sensitive data:

```javascript
// ✅ Good: Log with context
console.log(`[${requestId}] ChatGPT request: ${tokens} tokens`);

// ❌ Bad: Log sensitive data
console.log('API Key:', openaiApiKey);
console.log('User password:', password);
```

**Log hooks for external services:**
- Ready for Sentry, LogRocket, or Datadog integration
- Use `requestId` for request tracing
- Structured format for easy parsing

---

## 4. Plugin & WebView Security

### Architecture

```
VST3 Plugin
    └─ WebView (WKWebView on Mac, WebView2 on Windows)
         └─ React Frontend
              └─ Backend API (https://sairyne-fullai-5.onrender.com)
                   └─ OpenAI API (key never exposed to plugin)
```

### Security Properties

1. **Plugin never sees OpenAI key**
   - Key is only on backend
   - Plugin can't make direct calls to OpenAI

2. **Backend is the only gateway to AI**
   - All AI requests go through `/api/chat/message`
   - Backend validates and rate-limits

3. **WebView isolation**
   - Frontend can't access plugin internals
   - Frontend can't access system files or process

### Client Identifier Header

Requests from the plugin include:
```
X-Sairyne-Client: vst3-web
```

**Purpose:**
- Identify plugin requests on backend
- Apply plugin-specific rate limits (future)
- Monitor plugin usage
- Detect spoofed requests

---

## 5. API Abuse Prevention

### What We Protect Against

| Attack | Protection |
|--------|-----------|
| **API key theft** | Keys stored in env vars, never in code |
| **Direct OpenAI calls** | Plugin can't call OpenAI directly |
| **Cost explosion** | Token validation, rate limiting, size limits |
| **DDoS attacks** | Rate limiting (100 req/min per IP) |
| **Malformed requests** | Input validation on all endpoints |
| **Large payloads** | 10KB body size limit |
| **Stack trace leaks** | Error handler hides internals in production |

### Cost Control

**At the application level:**
- Max message: 5,000 characters (~1,250 tokens)
- Max history: 20 messages (~5,000 tokens)
- Max response: 300 tokens (hardcoded)
- **Total per request:** ~6,550 tokens max
- **Estimated cost:** ~$0.03 USD per request (GPT-4)

**At the service level:**
- Set usage alerts on OpenAI dashboard
- Set spend cap on OpenAI account
- Monitor Render instance spending

**Recommended alerts:**
- ⚠️ Warning at 80% of daily budget
- 🔴 Hard stop at 100% of daily budget

---

## 6. Development vs. Production

### Development Mode (`NODE_ENV=development`)

- CORS: Strict whitelist (configured in code)
- Errors: Full details logged
- Rate limiting: Active but logged
- Validation: Full details on failure

**Enable dev mode:**
```bash
NODE_ENV=development npm run dev
```

### Production Mode (Render)

- CORS: Strict whitelist (from env variables)
- Errors: Minimal details (no stack traces)
- Rate limiting: Active, errors not logged
- Validation: User-friendly errors only
- Node modules: Optimized, no dev dependencies

**Render automatically sets:**
```
NODE_ENV=production
```

---

## 7. Incident Response

### If an API Key is Leaked

**Immediate (< 1 hour):**
1. ⏸️ Revoke the leaked key on OpenAI dashboard
2. 🔑 Generate a new API key
3. 🔄 Update Render environment variable: `OPENAI_API_KEY`
4. 📊 Monitor for unauthorized usage on OpenAI dashboard

**Follow-up (< 24 hours):**
1. 🔍 Review recent API usage for anomalies
2. 📝 Document what happened (date, time, scope)
3. 👥 Notify team/stakeholders
4. 🔐 Audit how key was exposed (code review, logs, etc.)

**Prevention:**
1. Enable GitHub secret scanning
2. Use branch protection on main
3. Run security audits monthly

---

## 8. GitHub Security Settings

### Recommended Configuration

**Enable Secret Scanning:**
1. Go to repo → Settings → Security
2. Enable "Secret scanning"
3. Enable "Push protection" (blocks commits with secrets)

**Enable Dependabot:**
1. Settings → Security → Dependabot alerts
2. Auto-merge security updates

**Branch Protection:**
1. Settings → Branches
2. Protect `main` branch:
   - Require PR reviews
   - Dismiss stale reviews
   - Require status checks (CI/CD)

**Code Scanning:**
1. Actions → New workflow
2. Search for "CodeQL"
3. Enable for JavaScript/TypeScript

---

## 9. OpenAI API Best Practices

### Account Security

1. **Billing alerts**
   - Set warning at $5/day
   - Set hard limit at $10/day
   - Monitor weekly usage

2. **API key rotation**
   - Rotate keys every 90 days
   - Keep old key for 24h during rotation
   - Never share keys in chat, email, or issues

3. **Usage monitoring**
   - Review usage dashboard daily
   - Look for unusual patterns (spike in tokens, requests)
   - Set up webhooks for alerts

### Model Selection

Current setup uses `gpt-4`:
- **Tokens:** ~$0.03 per request (3K tokens)
- **Alternative:** `gpt-3.5-turbo` (~$0.001 per request, faster)

**Cost optimization:**
```javascript
// Current: GPT-4 (powerful, expensive)
model: 'gpt-4'

// Faster & cheaper: GPT-3.5-turbo
model: 'gpt-3.5-turbo'

// Context window
gpt-4: 8K tokens max
gpt-3.5-turbo: 4K tokens max
```

---

## 10. Security Checklist

### Before Production Deployment

- [ ] `OPENAI_API_KEY` set in Render environment variables
- [ ] `NODE_ENV=production` set on Render
- [ ] `CORS_ORIGINS` configured for production domains
- [ ] GitHub secret scanning enabled
- [ ] `.gitignore` includes `.env` files
- [ ] No hardcoded secrets in code (grep for `sk-`, `password`, etc.)
- [ ] Rate limiting active and tested
- [ ] Error handling doesn't expose stack traces
- [ ] Input validation on all endpoints
- [ ] HTTPS only (Render provides SSL/TLS)
- [ ] Render logs are not publicly accessible

### Ongoing Operations

- [ ] Weekly: Review OpenAI API usage dashboard
- [ ] Weekly: Check for security alerts on GitHub
- [ ] Monthly: Review Render logs for errors
- [ ] Monthly: Run OWASP Top 10 checks
- [ ] Quarterly: Security audit of codebase
- [ ] Quarterly: Rotate API keys

---

## 11. Contact & Support

**Security concerns?** Please report via GitHub Issues (privately, if possible).

**Questions about this policy?** Contact the maintainers.

---

## References

- [OWASP Top 10](https://owasp.org/Top10/)
- [OpenAI API Security Best Practices](https://platform.openai.com/docs/guides/safety-best-practices)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**Last Updated:** December 2025  
**Status:** Production Ready  
**Version:** 1.0

