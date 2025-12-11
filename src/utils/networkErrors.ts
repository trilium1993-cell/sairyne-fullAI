/**
 * Network error handling utilities for Sairyne plugin
 * Provides consistent error messages and user-friendly network state detection
 */

export enum NetworkErrorType {
  NO_INTERNET = 'NO_INTERNET',
  TIMEOUT = 'TIMEOUT',
  SERVER_ERROR = 'SERVER_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  UNKNOWN = 'UNKNOWN',
  OFFLINE_MODE = 'OFFLINE_MODE'
}

export interface NetworkError {
  type: NetworkErrorType;
  message: string;
  details?: string;
  statusCode?: number;
  isRetryable: boolean;
}

/**
 * Classify a network error and return user-friendly message
 */
export function classifyNetworkError(error: unknown): NetworkError {
  // Check if it's a timeout
  if (error instanceof Error) {
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      return {
        type: NetworkErrorType.TIMEOUT,
        message: 'Connection timeout. Please check your internet and try again.',
        details: error.message,
        isRetryable: true
      };
    }

    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        type: NetworkErrorType.NO_INTERNET,
        message: 'Unable to connect to the server. Please check your internet connection.',
        details: error.message,
        isRetryable: true
      };
    }

    if (error.message.includes('JSON')) {
      return {
        type: NetworkErrorType.PARSE_ERROR,
        message: 'Server sent invalid data. Please try again.',
        details: error.message,
        isRetryable: true
      };
    }

    return {
      type: NetworkErrorType.UNKNOWN,
      message: 'An unexpected error occurred. Please try again.',
      details: error.message,
      isRetryable: true
    };
  }

  return {
    type: NetworkErrorType.UNKNOWN,
    message: 'An unexpected error occurred.',
    isRetryable: true
  };
}

/**
 * Classify HTTP error by status code
 */
export function classifyHttpError(statusCode: number, statusText?: string): NetworkError {
  if (statusCode === 0) {
    return {
      type: NetworkErrorType.NO_INTERNET,
      message: 'No internet connection. Please check your network.',
      statusCode: 0,
      isRetryable: true
    };
  }

  if (statusCode >= 500) {
    return {
      type: NetworkErrorType.SERVER_ERROR,
      message: 'Server is temporarily unavailable. Please try again in a moment.',
      statusCode,
      details: `HTTP ${statusCode}${statusText ? ': ' + statusText : ''}`,
      isRetryable: true
    };
  }

  if (statusCode === 429) {
    return {
      type: NetworkErrorType.TIMEOUT,
      message: 'Too many requests. Please wait a moment and try again.',
      statusCode,
      isRetryable: true
    };
  }

  if (statusCode === 408 || statusCode === 504) {
    return {
      type: NetworkErrorType.TIMEOUT,
      message: 'Connection timeout. Please check your internet and try again.',
      statusCode,
      isRetryable: true
    };
  }

  return {
    type: NetworkErrorType.UNKNOWN,
    message: `Server error (${statusCode}). Please try again.`,
    statusCode,
    isRetryable: true
  };
}

/**
 * Get user-friendly error message for UI display
 * Keep message short and actionable
 */
export function getErrorMessage(error: NetworkError | unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as NetworkError).message;
  }

  const classified = classifyNetworkError(error);
  return classified.message;
}

/**
 * Check if user has internet connection (basic check)
 * Note: This is not 100% reliable, but useful as a hint
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return true; // Assume online in SSR context
  }
  return navigator.onLine !== false;
}

/**
 * Create a fetch with timeout
 * @param url URL to fetch
 * @param options Fetch options
 * @param timeoutMs Timeout in milliseconds (default 15000ms = 15 seconds)
 * @returns Promise with response
 */
export async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutMs: number = 15000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Check if it's an abort (timeout)
    if (error instanceof DOMException && error.name === 'AbortError') {
      const timeoutError = new Error(
        `Request timeout after ${timeoutMs}ms. Please check your internet connection.`
      );
      throw timeoutError;
    }

    throw error;
  }
}

/**
 * Retry a failed request with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries (default 3)
 * @param delayMs Initial delay in milliseconds (default 1000ms)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const networkError = classifyNetworkError(error);
      if (!networkError.isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      const waitTime = delayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

/**
 * Offline mode detection and management
 * Tracks weak connections and offline state
 */
export const offlineMode = {
  isWeakConnection: false,
  
  markWeakConnection(): void {
    this.isWeakConnection = true;
  },
  
  clearWeakConnection(): void {
    this.isWeakConnection = false;
  },
  
  isOffline(): boolean {
    return !isOnline() || this.isWeakConnection;
  }
};


