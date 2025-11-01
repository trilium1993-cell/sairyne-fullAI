/**
 * API Configuration for Sairyne
 * 
 * This file contains all API-related configuration.
 * Environment variables are loaded from .env files.
 */

/**
 * Base API URL
 * - Development: http://localhost:3001
 * - Production: Your deployed backend URL (Railway/Render)
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

