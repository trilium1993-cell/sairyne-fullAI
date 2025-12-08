/**
 * Offline mode detection and local caching utilities
 * Helps the plugin gracefully handle network disconnections
 */

import React from 'react';

export interface OfflineState {
  isOnline: boolean;
  isWeakConnection: boolean;
  hasBeenOnline: boolean; // Has connected at least once in this session
  lastOnlineTime: number | null;
}

class OfflineModeManager {
  private state: OfflineState = {
    isOnline: true,
    isWeakConnection: false,
    hasBeenOnline: false,
    lastOnlineTime: null
  };

  private listeners: Set<(state: OfflineState) => void> = new Set();
  private pendingRequests: Map<string, AbortController> = new Map();

  constructor() {
    this.initializeListeners();
    this.detectInitialState();
  }

  /**
   * Initialize global online/offline event listeners
   */
  private initializeListeners() {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('online', () => {
      console.log('[OfflineMode] Back online');
      this.setOnline(true);
    });

    window.addEventListener('offline', () => {
      console.log('[OfflineMode] Went offline');
      this.setOnline(false);
    });
  }

  /**
   * Detect initial online state
   */
  private detectInitialState() {
    if (typeof navigator !== 'undefined') {
      const isOnline = navigator.onLine !== false;
      this.state.isOnline = isOnline;
      if (isOnline) {
        this.state.hasBeenOnline = true;
        this.state.lastOnlineTime = Date.now();
      }
    }
  }

  /**
   * Update online state and notify listeners
   */
  private setOnline(isOnline: boolean) {
    const wasOnline = this.state.isOnline;
    this.state.isOnline = isOnline;

    if (isOnline) {
      this.state.hasBeenOnline = true;
      this.state.lastOnlineTime = Date.now();
      this.state.isWeakConnection = false;
    }

    if (wasOnline !== isOnline) {
      this.notifyListeners();
    }
  }

  /**
   * Mark connection as weak (due to timeout, slow response, etc.)
   */
  markWeakConnection() {
    if (!this.state.isWeakConnection) {
      console.warn('[OfflineMode] Detected weak connection');
      this.state.isWeakConnection = true;
      this.notifyListeners();
    }
  }

  /**
   * Clear weak connection flag when connection recovers
   */
  clearWeakConnection() {
    if (this.state.isWeakConnection) {
      console.log('[OfflineMode] Connection recovered');
      this.state.isWeakConnection = false;
      this.notifyListeners();
    }
  }

  /**
   * Subscribe to offline state changes
   */
  subscribe(callback: (state: OfflineState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.getState());
      } catch (error) {
        console.error('[OfflineMode] Listener error:', error);
      }
    });
  }

  /**
   * Get current offline state
   */
  getState(): OfflineState {
    return { ...this.state };
  }

  /**
   * Check if app is offline or has weak connection
   */
  isEffectivelyOffline(): boolean {
    return !this.state.isOnline || this.state.isWeakConnection;
  }

  /**
   * Get user-friendly status message
   */
  getStatusMessage(): string {
    if (!this.state.isOnline) {
      return 'You appear to be offline. Sairyne requires an internet connection.';
    }

    if (this.state.isWeakConnection) {
      return 'Your connection seems slow. This may affect AI responses.';
    }

    return 'Connected';
  }

  /**
   * Track a pending request (for cancellation if needed)
   */
  trackRequest(id: string, controller: AbortController) {
    this.pendingRequests.set(id, controller);
  }

  /**
   * Remove tracked request
   */
  untrackRequest(id: string) {
    this.pendingRequests.delete(id);
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    this.pendingRequests.forEach(controller => {
      controller.abort();
    });
    this.pendingRequests.clear();
  }
}

// Singleton instance
export const offlineMode = new OfflineModeManager();

/**
 * React hook for offline state
 * Usage: const offlineState = useOfflineMode();
 */
export function useOfflineModeState() {
  const [state, setState] = React.useState<OfflineState>(offlineMode.getState());

  React.useEffect(() => {
    const unsubscribe = offlineMode.subscribe(setState);
    return unsubscribe;
  }, []);

  return state;
}

/**
 * Simple hook to check if effectively offline
 * Usage: const isOffline = useIsOffline();
 */
export function useIsOffline() {
  const [isOffline, setIsOffline] = React.useState(offlineMode.isEffectivelyOffline());

  React.useEffect(() => {
    const unsubscribe = offlineMode.subscribe(() => {
      setIsOffline(offlineMode.isEffectivelyOffline());
    });
    return unsubscribe;
  }, []);

  return isOffline;
}

/**
 * Local session cache for messages (simple, in-memory)
 * Helps preserve chat when connection drops temporarily
 */
class SessionCache {
  private cache: Map<string, unknown> = new Map();

  set<T>(key: string, value: T) {
    this.cache.set(key, value);
  }

  get<T>(key: string): T | null {
    const value = this.cache.get(key);
    return value as T | null;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }

  getAllKeys(): string[] {
    return Array.from(this.cache.keys());
  }
}

export const sessionCache = new SessionCache();

