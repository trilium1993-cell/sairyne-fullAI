/**
 * API Configuration for Sairyne
 * 
 * This file contains all API-related configuration.
 * Environment variables are loaded from .env files.
 */

/**
 * Base API URL
 * - Development: http://localhost:3001 (or whatever VITE_API_URL is set to)
 * - Production: Your deployed backend URL (Railway/Render)
 */
const RENDER_API_BASE = 'https://sairyne-fullai-5.onrender.com';

function inferApiBase(): string {
  // `import.meta.env` is provided by Vite in the browser build. In plain Node (or some tooling),
  // it can be undefined, so access it defensively.
  const fromEnv = (import.meta as any)?.env?.VITE_API_URL as string | undefined;

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;

    // If we are hosted on Vercel, prefer same-origin `/api/...` and let Vercel rewrite/proxy to Render.
    // This avoids cross-domain fetch restrictions in some WKWebView setups.
    if (hostname.endsWith('vercel.app') || hostname === 'sairyne-ai.vercel.app') {
      return '';
    }

    // If opened from disk inside the plugin, prefer the hosted backend.
    if (protocol === 'file:') {
      return RENDER_API_BASE;
    }

    // If running locally (dev/proxy), prefer local backend explicitly.
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Prefer .env(.local) override if provided; otherwise default to 3001.
      return fromEnv || 'http://127.0.0.1:3001';
    }

    // Default production fallback
    return RENDER_API_BASE;
  }

  if (fromEnv) return fromEnv;

  // SSR/unknown: keep relative
  return '';
}

export const API_URL = inferApiBase();

if ((import.meta as any)?.env?.DEV) {
  console.debug('[config] API_URL:', API_URL);
}

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  /** Main chat endpoint for both Learn and Pro modes */
  CHAT_MESSAGE: '/api/chat/message',
  
  /** Health check endpoint */
  HEALTH: '/api/health',
} as const;

/**
 * API Configuration
 */
export const API_CONFIG = {
  /** Request timeout in milliseconds */
  TIMEOUT: 10000,
  
  /** Retry attempts for failed requests */
  RETRY_ATTEMPTS: 3,
  
  /** Default headers */
  HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;

/**
 * Helper function to build full API URL
 */
export function getApiUrl(endpoint: string): string {
  return `${API_URL}${endpoint}`;
}

/**
 * Check if API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.HEALTH), {
      method: 'GET',
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
    });
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}

