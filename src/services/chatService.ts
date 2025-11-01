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
   */
  static async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    try {
      const url = `${API_URL}${API_ENDPOINTS.CHAT_MESSAGE}`;
      console.log('🌐 Sending request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistory.slice(-10) // Last 10 messages for context
        }),
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      console.log('✅ API Success:', data);
      return data.response;
    } catch (error) {
      console.error('❌ Chat service error:', error);
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

