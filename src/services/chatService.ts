import { API_URL, API_ENDPOINTS } from '../config/api';

interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
}

interface ChatResponse {
  response: string;
  timestamp: number;
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
    try {
      const isDev = import.meta.env.DEV;
      // Use Render backend for all AI (Pro Mode + Learn Mode)
      const url = 'https://sairyne-fullai-5.onrender.com/api/chat/message';
      if (isDev) {
        console.debug('[chat] POST', url, 'mode:', mode);
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistory.slice(-10), // Last 10 messages for context
          mode // Pass the mode to backend for proper prompt selection
        }),
      });

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
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[chat] request failed', error);
      }
      throw error;
    }
  }

  /**
   * Analyze Learn Mode context and generate AI continuation
   * Uses Render backend for AI processing (has OPENAI_API_KEY)
   */
  static async analyzeLearnModeContext(learnContext: ChatMessage[]): Promise<string> {
    try {
      const isDev = import.meta.env.DEV;
      // Use Render backend for Learn Mode AI (it has the OPENAI_API_KEY)
      const url = 'https://sairyne-fullai-5.onrender.com/api/chat/analyze-learn-context';
      
      if (isDev) {
        console.debug('[chat] POST analyze-learn-context', url);
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          learnContext
        }),
      });

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
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[chat] analyze-learn-context failed', error);
      }
      throw error;
    }
  }

  /**
   * Check backend health
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}${API_ENDPOINTS.HEALTH}`);
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}

