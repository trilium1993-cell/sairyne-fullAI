import { API_ENDPOINTS, getApiUrl } from '../config/api';

interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
}

interface ChatResponse {
  response: string;
  timestamp: number;
}

/**
 * Fetch with timeout wrapper
 * Prevents hanging requests by aborting after timeoutMs
 */
function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(timeoutId));
}

/**
 * Retry with exponential backoff
 * Automatically retry failed requests with increasing delays
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        // Last attempt failed
        break;
      }

      // Calculate delay: 1s, 2s, 4s, 8s...
      const delayMs = initialDelayMs * Math.pow(2, attempt);
      
      if (import.meta.env.DEV) {
        console.log(
          `⚠️ Attempt ${attempt + 1} failed. Retrying in ${delayMs}ms...`,
          lastError?.message
        );
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

export class ChatService {
  /**
   * Send message to AI backend
   * Uses Render backend for all AI processing (stable, has OPENAI_API_KEY)
   * @param mode - 'learn', 'create', or 'pro' - determines the AI behavior
   */
  static async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    mode: 'learn' | 'create' | 'pro' = 'create'
  ): Promise<string> {
    const isDev = import.meta.env.DEV;
    const url = getApiUrl(API_ENDPOINTS.CHAT_MESSAGE);
    
    if (isDev) {
      console.debug('[chat] POST', url, 'mode:', mode);
    }

    return retryWithBackoff(
      async () => {
        const response = await fetchWithTimeout(
          url,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message,
              conversationHistory: conversationHistory.slice(-10), // Last 10 messages for context
              mode // Pass the mode to backend for proper prompt selection
            }),
          },
          30000 // 30 second timeout
        );

        if (isDev) {
          console.debug('[chat] status', response.status);
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (isDev) {
            console.error('[chat] error response', errorData);
          }
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data: ChatResponse = await response.json();
        if (isDev) {
          console.debug('[chat] success', data);
        }
        return data.response;
      },
      3, // Max 3 retries
      1000 // 1 second initial delay
    );
  }

  /**
   * Analyze Learn Mode context and generate AI continuation
   * Uses Render backend for AI processing (has OPENAI_API_KEY)
   */
  static async analyzeLearnModeContext(learnContext: ChatMessage[]): Promise<string> {
    const isDev = import.meta.env.DEV;
    const url = getApiUrl('/api/chat/analyze-learn-context');
    
    if (isDev) {
      console.debug('[chat] POST analyze-learn-context', url);
    }

    return retryWithBackoff(
      async () => {
        const response = await fetchWithTimeout(
          url,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              learnContext
            }),
          },
          30000 // 30 second timeout
        );

        if (isDev) {
          console.debug('[chat] status', response.status);
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (isDev) {
            console.error('[chat] error response', errorData);
          }
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data: ChatResponse = await response.json();
        if (isDev) {
          console.debug('[chat] analyze-learn-context success', data);
        }
        return data.response;
      },
      3, // Max 3 retries
      1000 // 1 second initial delay
    );
  }

  /**
   * Check backend health
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.HEALTH));
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}

