/**
 * JUCE Bridge Interface
 * Коммуникация между WebView (React) и JUCE (C++)
 * 
 * UPDATED: Uses postMessage only, no location.href
 * Includes message queue for early saves before bridge is ready
 */

import type { AudioAnalysisResult } from '../../types/audio';

// ============================================
// ТИПЫ ДЛЯ JUCE BRIDGE
// ============================================

/**
 * Типы сообщений от JS -> JUCE
 */
export enum JuceMessageType {
  // Аутентификация
  AUTH_REQUEST = 'auth_request',
  AUTH_LOGOUT = 'auth_logout',
  
  // Анализ аудио
  START_ANALYSIS = 'start_analysis',
  STOP_ANALYSIS = 'stop_analysis',
  GET_ANALYSIS_STATUS = 'get_analysis_status',
  
  // Навигация UI
  NAVIGATE_TO = 'navigate_to',
  
  // Системные
  READY = 'webview_ready',
  LOG = 'log_message',
  OPEN_URL = 'open_url', // Открыть URL в системном браузере
  SAVE_DATA = 'save_data', // Сохранить данные в JUCE PropertiesFile
  LOAD_DATA = 'load_data', // Загрузить данные из JUCE PropertiesFile
}

/**
 * Типы сообщений от JUCE -> JS
 */
export enum JuceEventType {
  // Аутентификация
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  
  // Анализ аудио
  ANALYSIS_STARTED = 'analysis_started',
  ANALYSIS_PROGRESS = 'analysis_progress',
  ANALYSIS_COMPLETE = 'analysis_complete',
  ANALYSIS_ERROR = 'analysis_error',
  ANALYSIS_STOPPED = 'analysis_stopped',
  
  // Системные
  PLUGIN_READY = 'plugin_ready',
  ERROR = 'error',
  DATA_LOADED = 'data_loaded', // Данные загружены из JUCE
}

/**
 * Структура сообщения от JS -> JUCE
 */
export interface JuceMessage<T = unknown> {
  type: JuceMessageType;
  payload?: T;
  timestamp?: number;
}

/**
 * Структура события от JUCE -> JS
 */
export interface JuceEvent<T = unknown> {
  type: JuceEventType;
  payload?: T;
  timestamp?: number;
}

// ============================================
// PAYLOADS ДЛЯ РАЗНЫХ ТИПОВ СООБЩЕНИЙ
// ============================================

export interface AuthRequestPayload {
  username: string;
  password: string;
}

export interface AnalysisProgressPayload {
  progress: number; // 0-100
  stage: string;
}

export interface NavigationPayload {
  screen: string;
  params?: Record<string, unknown>;
}

export interface OpenUrlPayload {
  url: string;
}

export interface SaveDataPayload {
  key: string;
  value: string;
}

export interface LoadDataPayload {
  key: string;
}

// ============================================
// JUCE BRIDGE STATE MANAGEMENT
// ============================================

// Global state for JUCE bridge readiness
if (typeof window !== 'undefined') {
  if (!(window as any).__sairyneJuceReady) {
    (window as any).__sairyneJuceReady = false;
  }
  // Store ALL pending saves (multiple keys can be written before bridge is ready)
  if (!(window as any).__sairynePendingSaves) {
    (window as any).__sairynePendingSaves = new Map<string, string>();
  }
  // Store pending loads requested before bridge is ready
  if (!(window as any).__sairynePendingLoadKeys) {
    (window as any).__sairynePendingLoadKeys = new Set<string>();
  }
}

/**
 * Check if JUCE bridge is ready
 */
function isJuceReady(): boolean {
  if (typeof window === 'undefined') return false;
  return (window as any).__sairyneJuceReady === true;
}

/**
 * Set JUCE bridge ready state
 */
function setJuceReady(ready: boolean): void {
  if (typeof window === 'undefined') return;
  (window as any).__sairyneJuceReady = ready;
  console.log('[JUCE Bridge] 🔄 juceReady set to:', ready);
}

/**
 * Store pending save operation
 */
function setPendingSave(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  const pending: Map<string, string> = (window as any).__sairynePendingSaves;
  pending.set(key, value);
  console.log('[JUCE Bridge] 💾 Stored pending save:', key, `value length: ${value.length}`, 'pending count:', pending.size);
}

function setPendingLoad(key: string): void {
  if (typeof window === 'undefined') return;
  const pending: Set<string> = (window as any).__sairynePendingLoadKeys;
  pending.add(key);
  console.log('[JUCE Bridge] ⏳ Stored pending load:', key, 'pending loads:', pending.size);
}

/**
 * Get and clear pending save operations
 */
function getPendingSaves(): Array<{ key: string; value: string }> {
  if (typeof window === 'undefined') return [];
  const pending: Map<string, string> = (window as any).__sairynePendingSaves;
  if (!pending || pending.size === 0) return [];
  const entries = Array.from(pending.entries()).map(([key, value]) => ({ key, value }));
  pending.clear();
  console.log('[JUCE Bridge] 📤 Retrieved pending saves:', entries.length);
  return entries;
}

function getPendingLoads(): string[] {
  if (typeof window === 'undefined') return [];
  const pending: Set<string> = (window as any).__sairynePendingLoadKeys;
  if (!pending || pending.size === 0) return [];
  const keys = Array.from(pending);
  pending.clear();
  console.log('[JUCE Bridge] 📤 Retrieved pending loads:', keys.length);
  return keys;
}
/**
 * Send message to JUCE via postMessage (iframe → wrapper → JUCE)
 */
function sendToJuceViaPostMessage(type: string | JuceMessageType, payload: any): void {
  // Convert enum to string if needed
  const typeStr: string = typeof type === 'string' ? type : String(type);
  
  console.log('[JUCE Bridge] 📤 sendToJuceViaPostMessage called:', typeStr, payload ? JSON.stringify(payload).substring(0, 200) : 'no payload');
  console.log('[JUCE Bridge] 🔍 Payload key:', payload?.key);
  console.log('[JUCE Bridge] 🔍 Payload value length:', payload?.value?.length);
  
  try {
    const message = {
      type: 'JUCE_DATA',
      command: typeStr,
      payload: payload,
      timestamp: Date.now()
    };
    
    console.log('[JUCE Bridge] 📤 Full message:', JSON.stringify(message).substring(0, 500));
    console.log('[JUCE Bridge] 🔍 window.parent exists?', window.parent !== undefined);
    console.log('[JUCE Bridge] 🔍 window.parent !== window?', window.parent !== window);
    console.log('[JUCE Bridge] 🔍 window.top exists?', window.top !== undefined);
    console.log('[JUCE Bridge] 🔍 window.top !== window?', window.top !== window);
    
    // Send to parent (wrapper) via postMessage when embedded in an iframe,
    // otherwise send to self. Many plugin hosts load the app directly (no iframe),
    // but still inject a message handler into the same window.
    if (window.parent && window.parent !== window) {
      console.log('[JUCE Bridge] 📤 Attempting to send postMessage to window.parent...');
      window.parent.postMessage(message, '*');
      console.log('[JUCE Bridge] ✅ postMessage sent to window.parent');
      console.log('[JUCE Bridge] ✅ Message should be received by wrapper script');
    } else if (window.top && window.top !== window) {
      console.log('[JUCE Bridge] 📤 Attempting to send postMessage to window.top...');
      window.top.postMessage(message, '*');
      console.log('[JUCE Bridge] ✅ postMessage sent to window.top');
      console.log('[JUCE Bridge] ✅ Message should be received by wrapper script');
    } else {
      console.log('[JUCE Bridge] 📤 No parent/top iframe found; sending postMessage to self (window)...');
      window.postMessage(message, '*');
      console.log('[JUCE Bridge] ✅ postMessage sent to window (self)');
    }
  } catch (error) {
    console.error('[JUCE Bridge] ❌ Failed to send postMessage:', error);
    console.error('[JUCE Bridge] ❌ Error details:', error instanceof Error ? error.message : String(error));
    console.error('[JUCE Bridge] ❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
  }
}

/**
 * Navigate to a JUCE custom-scheme URL so the host can intercept it (pageAboutToLoad/newWindowAttemptingToLoad).
 * Works even when not embedded in an iframe.
 */
function navigateToJuceScheme(url: string): void {
  try {
    if (window.top && window.top !== window) {
      window.top.location.href = url;
    } else if (window.parent && window.parent !== window) {
      window.parent.location.href = url;
    } else if (window.location) {
      window.location.href = url;
    }
  } catch (e) {
    console.warn('[JUCE Bridge] ⚠️ navigateToJuceScheme failed:', e);
  }
}

// ============================================
// BRIDGE IMPLEMENTATION
// ============================================

class JuceBridge {
  private listeners: Map<JuceEventType, Set<(event: JuceEvent) => void>> = new Map();

  /**
   * Проверка доступности JUCE
   */
  isAvailable(): boolean {
    const available = isJuceReady();
    console.log('[JUCE Bridge] isAvailable:', available);
    return available;
  }

  /**
   * Отправить сообщение в JUCE
   */
  post<T>(type: JuceMessageType, payload?: T): void {
    console.log('[JUCE Bridge] 📤 post() called:', type, payload ? JSON.stringify(payload).substring(0, 200) : 'no payload');
    sendToJuceViaPostMessage(type, payload);
  }

  /**
   * Подписаться на события от JUCE
   */
  on<T>(eventType: JuceEventType, callback: (event: JuceEvent<T>) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback as (event: JuceEvent) => void);
    
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(callback as (event: JuceEvent) => void);
      }
    };
  }

  /**
   * Эмитировать событие (для внутреннего использования)
   */
  emit<T>(eventType: JuceEventType, payload?: T): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const event: JuceEvent<T> = {
        type: eventType,
        payload,
        timestamp: Date.now(),
      };
      listeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error(`[JUCE Bridge] Error in listener for ${eventType}:`, error);
        }
      });
    }
  }
}

const bridge = new JuceBridge();

// ============================================
// EXPORTED FUNCTIONS
// ============================================

/**
 * Открыть URL в системном браузере
 */
export function openUrlInSystemBrowser(url: string): void {
  console.log('[JUCE Bridge] 🔄 openUrlInSystemBrowser called:', url);
  
  // Try multiple methods to ensure it works across hosts.
  // AU on macOS often uses WKWebView, which can silently block `window.open` and/or custom navigations.
  // So we only treat `window.open` as success if it returns a Window reference.
  //
  // Order:
  // 1) window.open (success if non-null)
  // 2) postMessage to wrapper/JUCE (OPEN_URL)
  // 3) custom scheme navigation (juce:// then sairyne://) as a last resort

  // Method 1: Use window.open (may return null if blocked)
  try {
    console.log('[JUCE Bridge] 📤 Method 1: Trying window.open');
    if (typeof window !== 'undefined' && window.open) {
      const opened = window.open(url, '_blank');
      if (opened) {
        console.log('[JUCE Bridge] ✅ window.open succeeded');
        return;
      }
      console.warn('[JUCE Bridge] ⚠️ window.open was blocked (returned null), falling back…');
    }
  } catch (e) {
    console.warn('[JUCE Bridge] ⚠️ window.open failed:', e);
  }

  // Method 2: Send OPEN_URL via postMessage (preferred in embedded plugin wrappers)
  try {
    console.log('[JUCE Bridge] 📤 Method 2: Trying postMessage OPEN_URL');
    sendToJuceViaPostMessage(JuceMessageType.OPEN_URL, { url });
    // If wrapper/JUCE is listening, this is enough.
    // Do not early-return if not embedded (sendToJuceViaPostMessage will log when no parent exists).
  } catch (e) {
    console.warn('[JUCE Bridge] ⚠️ postMessage OPEN_URL failed:', e);
  }
  
  // Method 3: Use juce:// scheme via location.href
  try {
    const juceUrl = `juce://open_url?url=${encodeURIComponent(url)}`;
    console.log('[JUCE Bridge] 📤 Method 3: Setting location.href to:', juceUrl);
    
    if (window.top && window.top !== window) {
      window.top.location.href = juceUrl;
    } else if (window.parent && window.parent !== window) {
      window.parent.location.href = juceUrl;
    } else if (window.location) {
      window.location.href = juceUrl;
    }
    console.log('[JUCE Bridge] ✅ location.href set successfully');
  } catch (e) {
    console.error('[JUCE Bridge] ❌ location.href failed:', e);
  }
  
  // Method 4: Fallback to sairyne:// scheme (if juce:// doesn't work)
  try {
    const sairyneUrl = `sairyne://open_url?url=${encodeURIComponent(url)}`;
    console.log('[JUCE Bridge] 📤 Method 4: Fallback to sairyne:// scheme');
    
    if (window.top && window.top !== window) {
      window.top.location.href = sairyneUrl;
    } else if (window.parent && window.parent !== window) {
      window.parent.location.href = sairyneUrl;
    } else if (window.location) {
      window.location.href = sairyneUrl;
    }
  } catch (e) {
    console.error('[JUCE Bridge] ❌ All methods failed:', e);
  }
}

/**
 * Сохранить данные в JUCE PropertiesFile
 * Uses postMessage only - no location.href
 */
export function saveDataToJuce(key: string, value: string): void {
  console.log('[JUCE Bridge] 🔄 saveDataToJuce called:', key, `value length: ${value.length}`);
  console.log('[JUCE Bridge] 📦 Value preview (first 200 chars):', value.substring(0, 200));
  console.log('[JUCE Bridge] 🔍 juceReady:', isJuceReady());
  console.log('[JUCE Bridge] 🔍 Key is sairyne_users?', key === 'sairyne_users');
  console.log('[JUCE Bridge] 🔍 Key is sairyne_projects?', key === 'sairyne_projects');
  
  // If bridge is not ready, store in pending queue
  if (!isJuceReady()) {
    console.log('[JUCE Bridge] ⏳ Bridge not ready, storing in pendingSave queue');
    console.log('[JUCE Bridge] ⏳ This save will be processed when onJuceInit fires');
    setPendingSave(key, value);
    return;
  }
  
  // Preferred: JUCE scheme (most reliable for AU/VST3 WebView integrations)
  // C++ side typically intercepts: juce://save?key=...&value=...
  try {
    const juceUrl = `juce://save?key=${encodeURIComponent(key)}&value=${encodeURIComponent(value)}`;
    console.log('[JUCE Bridge] 📤 Using juce scheme save:', juceUrl.substring(0, 200));
    navigateToJuceScheme(juceUrl);
    return;
  } catch (e) {
    console.warn('[JUCE Bridge] ⚠️ juce://save failed, falling back to postMessage:', e);
  }

  // Fallback: postMessage (for wrappers that translate messages to schemes)
  console.log('[JUCE Bridge] 📤 Fallback: sendToJuceViaPostMessage(save_data)');
  sendToJuceViaPostMessage(JuceMessageType.SAVE_DATA, { key, value });
}

/**
 * Загрузить данные из JUCE PropertiesFile
 * Uses postMessage only - no location.href
 */
export function loadDataFromJuce(key: string): void {
  console.log('[JUCE Bridge] 🔄 loadDataFromJuce called:', key);
  console.log('[JUCE Bridge] 🔍 juceReady:', isJuceReady());
  
  // If bridge is not ready, we can't load yet
  if (!isJuceReady()) {
    console.warn('[JUCE Bridge] ⚠️ Bridge not ready, queueing load request');
    setPendingLoad(key);
    return;
  }
  
  // Preferred: JUCE scheme (C++ intercepts: juce://load?key=...)
  try {
    const juceUrl = `juce://load?key=${encodeURIComponent(key)}`;
    console.log('[JUCE Bridge] 📤 Using juce scheme load:', juceUrl);
    navigateToJuceScheme(juceUrl);
    return;
  } catch (e) {
    console.warn('[JUCE Bridge] ⚠️ juce://load failed, falling back to postMessage:', e);
  }

  // Fallback: postMessage
  console.log('[JUCE Bridge] 📤 Fallback: sendToJuceViaPostMessage(load_data)');
  sendToJuceViaPostMessage(JuceMessageType.LOAD_DATA, { key });
}

/**
 * Подписаться на события загрузки данных из JUCE
 */
export function onDataLoaded(callback: (payload: { key: string; value: string }) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  // Set up global handler (will be called by C++ executeJavaScript)
  (window as any).onJuceDataLoaded = (key: string, value: string) => {
    console.log('[JUCE Bridge] 📥 onJuceDataLoaded called:', key, value ? `value length: ${value.length}` : 'empty');
    
    // Clear pending flag (data received, even if empty)
    if (typeof window !== 'undefined' && (window as any).__sairynePendingLoads) {
      (window as any).__sairynePendingLoads.delete(key);
      console.log('[JUCE Bridge] ✅ Cleared pending flag for:', key);
    }
    
    // Store in memory storage and window.__sairyneStorage
    if (value && value.length > 0) {
      if (typeof window !== 'undefined') {
        // Store in window.__sairyneStorage (which storage.ts syncs from)
        if (!(window as any).__sairyneStorage) {
          (window as any).__sairyneStorage = new Map();
        }
        (window as any).__sairyneStorage.set(key, value);
        console.log('[JUCE Bridge] ✅ Stored in __sairyneStorage:', key);
      }
      
      callback({ key, value });
    } else {
      console.log('[JUCE Bridge] ⚠️ Empty value received for key:', key, '- not calling callback');
    }
  };

  return () => {
    // Don't delete - C++ may call it later
  };
}

// ============================================
// GLOBAL FUNCTIONS EXPOSED TO WINDOW
// ============================================

if (typeof window !== 'undefined') {
  // Expose saveToJuce globally (called by storage.ts)
  (window as any).saveToJuce = (key: string, value: string) => {
    console.log('[JUCE Bridge] 🌐 window.saveToJuce called:', key, `value length: ${value.length}`);
    saveDataToJuce(key, value);
  };

  // Expose loadFromJuce globally (called by storage.ts)
  (window as any).loadFromJuce = (key: string) => {
    console.log('[JUCE Bridge] 🌐 window.loadFromJuce called:', key);
    loadDataFromJuce(key);
  };

  // Set up onJuceInit handler (called by C++ on plugin startup)
  (window as any).onJuceInit = (data: Record<string, string>) => {
    console.log('[JUCE Bridge] 📥 onJuceInit called with', Object.keys(data).length, 'keys');
    console.log('[JUCE Bridge] 📥 Keys:', Object.keys(data).join(', '));
    
    // Mark bridge as ready
    setJuceReady(true);
    console.log('[JUCE Bridge] ✅ Bridge marked as ready');
    
    // Store data in window.__sairyneStorage (accessible via storage.ts)
    if (typeof window !== 'undefined') {
      if (!(window as any).__sairyneStorage) {
        (window as any).__sairyneStorage = new Map();
      }
      Object.entries(data).forEach(([key, value]) => {
        (window as any).__sairyneStorage.set(key, value);
        console.log('[JUCE Bridge] ✅ Stored in __sairyneStorage:', key, `value length: ${value.length}`);
      });
    }
    
    // Also save to localStorage if available (as cache)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        Object.entries(data).forEach(([key, value]) => {
          window.localStorage.setItem(key, value);
        });
        console.log('[JUCE Bridge] ✅ Saved', Object.keys(data).length, 'keys to localStorage cache');
      } catch (e) {
        console.warn('[JUCE Bridge] ⚠️ Failed to save to localStorage:', e);
      }
    }
    
    // Process pending saves (can be multiple keys)
    const pendingSaves = getPendingSaves();
    if (pendingSaves.length > 0) {
      console.log('[JUCE Bridge] 📤 Processing pending saves:', pendingSaves.length);
      pendingSaves.forEach(({ key, value }) => {
        try {
          const juceUrl = `juce://save?key=${encodeURIComponent(key)}&value=${encodeURIComponent(value)}`;
          navigateToJuceScheme(juceUrl);
        } catch (e) {
          console.warn('[JUCE Bridge] ⚠️ Failed to process pending save via juce scheme:', key, e);
        }
      });
    }

    // Process pending loads (requested before bridge was ready)
    const pendingLoads = getPendingLoads();
    if (pendingLoads.length > 0) {
      console.log('[JUCE Bridge] 📤 Processing pending loads:', pendingLoads.length);
      pendingLoads.forEach((key) => {
        try {
          const juceUrl = `juce://load?key=${encodeURIComponent(key)}`;
          navigateToJuceScheme(juceUrl);
        } catch (e) {
          console.warn('[JUCE Bridge] ⚠️ Failed to process pending load:', key, e);
        }
      });
    }
    
    // Trigger custom event to notify components
    if (typeof window !== 'undefined') {
      // Emit a bulk event + per-key events (per-key is what most components listen for)
      window.dispatchEvent(new CustomEvent('sairyne-init-loaded', { detail: data }));
      Object.entries(data).forEach(([key, value]) => {
        window.dispatchEvent(new CustomEvent('sairyne-data-loaded', { detail: { key, value } }));
      });
      console.log('[JUCE Bridge] ✅ Dispatched sairyne-init-loaded + per-key sairyne-data-loaded events');
    }
  };
}

// ============================================
// LEGACY EXPORTS (for compatibility)
// ============================================

export function onAuthSuccess(callback: (payload: { user: any; token: string }) => void): () => void {
  return bridge.on(JuceEventType.AUTH_SUCCESS, callback);
}

export function onAuthFailure(callback: (payload: { error: string }) => void): () => void {
  return bridge.on(JuceEventType.AUTH_FAILURE, callback);
}

/**
 * Проверка доступности JUCE
 */
export function isJuceAvailable(): boolean {
  const available = bridge.isAvailable();
  console.log('[JUCE Bridge] isJuceAvailable:', available);
  return available;
}

/**
 * Подписаться на события анализа
 */
export function onAnalysisComplete(callback: (result: AudioAnalysisResult) => void): () => void {
  return bridge.on<AudioAnalysisResult>(JuceEventType.ANALYSIS_COMPLETE, callback);
}

export function onAnalysisProgress(callback: (payload: AnalysisProgressPayload) => void): () => void {
  return bridge.on<AnalysisProgressPayload>(JuceEventType.ANALYSIS_PROGRESS, callback);
}

export function onAnalysisError(callback: (error: { message: string }) => void): () => void {
  return bridge.on<{ message: string }>(JuceEventType.ANALYSIS_ERROR, callback);
}

/**
 * Legacy functions for compatibility
 */
export function authenticateUser(username: string, password: string): void {
  bridge.post(JuceMessageType.AUTH_REQUEST, { username, password });
}

export function startAudioAnalysis(): void {
  bridge.post(JuceMessageType.START_ANALYSIS);
}

export function stopAudioAnalysis(): void {
  bridge.post(JuceMessageType.STOP_ANALYSIS);
}

export function getAnalysisStatus(): void {
  bridge.post(JuceMessageType.GET_ANALYSIS_STATUS);
}

export function navigateTo(screen: string, params?: Record<string, unknown>): void {
  bridge.post(JuceMessageType.NAVIGATE_TO, { screen, params });
}

export function logToJuce(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  bridge.post(JuceMessageType.LOG, { message, level });
}

// Экспортируем bridge для продвинутого использования
export default bridge;

