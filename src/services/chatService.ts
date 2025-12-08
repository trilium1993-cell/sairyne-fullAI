import { API_URL, API_ENDPOINTS } from '../config/api';
import { fetchWithTimeout, classifyHttpError, getErrorMessage, offlineMode } from '../utils/networkErrors';

interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
}

interface ChatResponse {
  response: string;
  timestamp: number;
}

const CHAT_REQUEST_TIMEOUT_MS = 30000; // 30 seconds for AI responses (longer than default)
const HEALTH_CHECK_TIMEOUT_MS = 10000; // 10 seconds for health check

export class ChatService {
  /**
   * Send message to AI backend with timeout and error handling
   */
  static async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    const isDev = import.meta.env.DEV;
    
    try {
      const url = `${API_URL}${API_ENDPOINTS.CHAT_MESSAGE}`;
      if (isDev) {
        console.debug('[chat] POST', url);
      }
      
      // Use fetch with timeout
      const response = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            conversationHistory: conversationHistory.slice(-10) // Last 10 messages for context
          }),
        },
        CHAT_REQUEST_TIMEOUT_MS
      );

      if (isDev) {
        console.debug('[chat] status', response.status);
      }

      // Clear weak connection flag on success
      offlineMode.clearWeakConnection();

      if (!response.ok) {
        // Try to parse error details
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (parseError) {
          // If we can't parse JSON, that's OK, we'll use HTTP status
        }

        const networkError = classifyHttpError(response.status, response.statusText);
        const errorMessage = errorData?.error || networkError.message;
        
        if (isDev) {
          console.error('[chat] error response', { status: response.status, error: errorMessage });
        }
        throw new Error(errorMessage);
      }

      const data: ChatResponse = await response.json();
      if (isDev) {
        console.debug('[chat] success', data);
      }
      return data.response;
    } catch (error) {
      // Mark weak connection if it's a timeout
      if (error instanceof Error && error.message.includes('timeout')) {
        offlineMode.markWeakConnection();
      }

      if (isDev) {
        console.error('[chat] request failed:', error);
      }
      
      // Re-throw with classification
      throw error;
    }
  }

  /**
   * Check backend health with timeout
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetchWithTimeout(
        `${API_URL}${API_ENDPOINTS.HEALTH}`,
        {},
        HEALTH_CHECK_TIMEOUT_MS
      );

      if (response.ok) {
        offlineMode.clearWeakConnection();
        return true;
      }

      // Server responded but with error status
      return false;
    } catch (error) {
      // Mark weak connection on timeout
      if (error instanceof Error && error.message.includes('timeout')) {
        offlineMode.markWeakConnection();
      }

      if (import.meta.env.DEV) {
        console.error('[chat] health check failed:', error);
      }
      return false;
    }
  }

  /**
   * Get a user-friendly error message for display
   */
  static getErrorMessage(error: unknown): string {
    return getErrorMessage(error);
  }
}

