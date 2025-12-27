/**
 * Storage utility with WebView compatibility
 * Always uses JUCE for persistence, localStorage is only a UI cache
 */

import { compressToBase64, decompressFromBase64 } from './lzString';

const IS_DEV = Boolean((import.meta as any)?.env?.DEV);

// In-memory storage as fallback when localStorage is not available
const memoryStorage: Map<string, string> = new Map();
// Prevent save storms to the JUCE bridge (especially expensive keys like chat state).
// We keep this entirely in-memory so it resets on page reload (which is fine).
const lastSentToJuceAt: Map<string, number> = new Map();
const lastSentToJuceValue: Map<string, string> = new Map();
const pendingJuceSaveTimer: Map<string, number> = new Map();
const pendingJuceSaveValue: Map<string, string> = new Map();

// Keys that can be very large and/or updated frequently.
const THROTTLED_JUCE_KEYS = new Set<string>([
  'sairyne_functional_chat_state_v1',
]);

function isEmbeddedRuntime(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return (
      window.self !== window.top ||
      window.location.pathname?.toLowerCase().includes('embed-chat') ||
      window.location.search?.toLowerCase().includes('embed=1')
    );
  } catch {
    return true;
  }
}

function flushPendingJuceSaves(): void {
  try {
    if (typeof window === 'undefined') return;
    if (typeof (window as any)?.saveToJuce !== 'function') return;
    pendingJuceSaveValue.forEach((val, key) => {
      try {
        (window as any).saveToJuce(key, val);
        lastSentToJuceAt.set(key, Date.now());
        lastSentToJuceValue.set(key, val);
      } catch (e) {
        console.error('[Storage] ❌ flushPendingJuceSaves failed for key:', key, e);
      }
    });
  } catch (e) {
    console.error('[Storage] ❌ flushPendingJuceSaves failed:', e);
  } finally {
    try {
      pendingJuceSaveTimer.forEach((t) => {
        try {
          window.clearTimeout(t);
        } catch {}
      });
    } catch {}
    pendingJuceSaveTimer.clear();
    pendingJuceSaveValue.clear();
  }
}

// In embedded plugin hosts, flush any pending heavy writes when the page is being hidden/unloaded.
if (typeof window !== 'undefined') {
  try {
    window.addEventListener('pagehide', () => flushPendingJuceSaves());
    window.addEventListener('beforeunload', () => flushPendingJuceSaves());
    document.addEventListener('visibilitychange', () => {
      try {
        if (document.hidden) flushPendingJuceSaves();
      } catch {}
    });
  } catch {}
}

// Some keys are written by the app itself and can create event feedback loops in embedded hosts
// (e.g. ScreenManager listens to `sairyne-data-loaded` and may react to our own writes).
// For these keys, we persist, but we don't dispatch `sairyne-data-loaded`.
const NO_DISPATCH_KEYS = new Set<string>([
  'sairyne_functional_chat_state_v1',
  'sairyne_ui_last_step',
  'sairyne_web_build',
]);

// Track pending load requests to prevent infinite loops
const pendingLoads: Set<string> = new Set();

// Expose pendingLoads to window for access from juceBridge
if (typeof window !== 'undefined') {
  (window as any).__sairynePendingLoads = pendingLoads;
}

// Initialize memory storage from window if available (for data loaded from JUCE)
// This runs on module load, but data may be injected later via onJuceInit
if (typeof window !== 'undefined' && (window as any).__sairyneStorage) {
  const windowStorage = (window as any).__sairyneStorage as Map<string, string>;
  windowStorage.forEach((value, key) => {
    memoryStorage.set(key, value);
    if (IS_DEV) console.log('[Storage] 🔄 Initialized from __sairyneStorage:', key);
  });
}

// Also sync from __sairyneStorage on every safeGetItem call (in case data was injected after module load)
function syncFromWindowStorage() {
  if (typeof window !== 'undefined' && (window as any).__sairyneStorage) {
    const windowStorage = (window as any).__sairyneStorage as Map<string, string>;
    windowStorage.forEach((value, key) => {
      // JUCE-injected data is the source of truth. If the injected value differs,
      // overwrite any cached memory value (important for runtime boot id).
      const existing = memoryStorage.get(key);
      if (existing !== value) {
        memoryStorage.set(key, value);
        if (IS_DEV) console.log('[Storage] 🔄 Synced from __sairyneStorage (overwrite):', key);
      }
    });
  }
}

// Keys that must never be served from localStorage cache (runtime-only / host-provided)
const NO_LOCALSTORAGE_KEYS = new Set<string>([
  'sairyne_runtime_boot_id',
  // Host-provided; must not be cached (prevents false OS reboot logic / stale reads)
  'sairyne_os_boot_id',
  // UI routing keys; caching can cause "stuck on Sign In" loops across host restarts
  'sairyne_ui_last_step',
  'sairyne_ui_pin_signin',
]);

/**
 * Check if localStorage is available and working
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    if (IS_DEV) console.log('[Storage] window is undefined');
    return false;
  }

  try {
    const testKey = '__localStorage_test__';
    window.localStorage.setItem(testKey, 'test');
    const retrieved = window.localStorage.getItem(testKey);
    window.localStorage.removeItem(testKey);
    
    // Проверяем, что данные действительно сохранились и читаются
    const isAvailable = retrieved === 'test';
    if (IS_DEV) console.log('[Storage] localStorage test:', isAvailable ? 'available' : 'not available');
    return isAvailable;
  } catch (error) {
    // localStorage заблокирован или недоступен
    if (IS_DEV) console.warn('[Storage] localStorage test failed:', error);
    return false;
  }
}

/**
 * Safe localStorage.getItem with error handling
 * Always requests from JUCE first, uses localStorage/memory as cache
 */
export function safeGetItem(key: string): string | null {
  // Sync from window.__sairyneStorage first (in case data was injected via onJuceInit)
  syncFromWindowStorage();
  
  // First, try memory storage (for data loaded from JUCE)
  if (memoryStorage.has(key)) {
    const value = memoryStorage.get(key);
    if (IS_DEV) console.log('[Storage] ✅ Retrieved from memory:', key, value ? `value length: ${value.length}` : 'null');
    if (key === 'sairyne_functional_chat_state_v1' && value && value.startsWith('lz:')) {
      try {
        const decoded = decompressFromBase64(value.slice(3));
        if (decoded) {
          memoryStorage.set(key, decoded);
          return decoded;
        }
      } catch {}
    }
    return value || null;
  }

  // Then try localStorage (as cache)
  if (!NO_LOCALSTORAGE_KEYS.has(key) && isLocalStorageAvailable()) {
    try {
      const value = window.localStorage.getItem(key);
      if (value !== null) {
        if (IS_DEV) console.log('[Storage] ✅ Retrieved from localStorage cache:', key, `value length: ${value.length}`);
        // Also store in memory for faster access next time
        memoryStorage.set(key, value);
        if (key === 'sairyne_functional_chat_state_v1' && value && value.startsWith('lz:')) {
          try {
            const decoded = decompressFromBase64(value.slice(3));
            if (decoded) {
              memoryStorage.set(key, decoded);
              return decoded;
            }
          } catch {}
        }
        return value;
      }
    } catch (error) {
      if (IS_DEV) console.warn('[Storage] localStorage.getItem failed:', error);
    }
  }

  // Check if data was injected via onJuceInit (stored in window.__sairyneStorage)
  if (typeof window !== 'undefined' && (window as any).__sairyneStorage) {
    const windowStorage = (window as any).__sairyneStorage as Map<string, string>;
    if (windowStorage.has(key)) {
      const value = windowStorage.get(key);
      if (value) {
        if (IS_DEV) console.log('[Storage] ✅ Retrieved from window.__sairyneStorage:', key, `value length: ${value.length}`);
        // Store in memory for faster access
        memoryStorage.set(key, value);
        if (key === 'sairyne_functional_chat_state_v1' && value && value.startsWith('lz:')) {
          try {
            const decoded = decompressFromBase64(value.slice(3));
            if (decoded) {
              memoryStorage.set(key, decoded);
              return decoded;
            }
          } catch {}
        }
        return value;
      }
    }
  }

  // Request from JUCE (async, will come via onJuceDataLoaded)
  // But prevent infinite loops - only request if not already pending
  if (!pendingLoads.has(key)) {
    if (IS_DEV) console.log('[Storage] 📤 Requesting from JUCE:', key);
    pendingLoads.add(key);
    
    // Clear pending flag after 5 seconds (in case response never comes)
    setTimeout(() => {
      pendingLoads.delete(key);
      if (IS_DEV) console.log('[Storage] ⏰ Pending timeout cleared for:', key);
    }, 5000);
    
    if (typeof window !== 'undefined' && (window as any).loadFromJuce) {
      (window as any).loadFromJuce(key);
    }
  } else {
    if (IS_DEV) console.log('[Storage] ⏳ Load request already pending for:', key, '- skipping duplicate request');
  }

  return null;
}

/**
 * Safe localStorage.setItem with error handling
 * Always saves to JUCE, localStorage is only a UI cache
 */
export function safeSetItem(key: string, value: string): boolean {
  // If value didn't change, do not spam JUCE persistence or event listeners.
  // Still refresh memory cache to keep synchronous reads consistent.
  const prev = memoryStorage.get(key);
  const isSame = typeof prev === 'string' && prev === value;

  // Always store in memory first (for immediate access)
  memoryStorage.set(key, value);
  if (IS_DEV) {
    console.log('[Storage] ✅ Stored in memory:', key, `value length: ${value.length}`);
    console.log('[Storage] 🔍 Key type:', key);
    console.log('[Storage] 🔍 Is sairyne_users?', key === 'sairyne_users');
    console.log('[Storage] 🔍 Is sairyne_projects?', key === 'sairyne_projects');
  }

  // ALWAYS save to JUCE (this is the source of truth), but guard against storms.
  try {
    // Deduplicate identical values: skip JUCE write + skip emitting events.
    if (isSame) {
      return true;
    }

    // Embedded plugin stability: store chat state compressed before persisting to JUCE.
    // This keeps payload small and avoids WKWebView reloads on large writes.
    let juceValue = value;
    if (key === 'sairyne_functional_chat_state_v1' && isEmbeddedRuntime()) {
      try {
        juceValue = `lz:${compressToBase64(value)}`;
      } catch {
        juceValue = value;
      }
    }

    // Throttle expensive keys to avoid freezing embedded WKWebView/JUCE bridge.
    const now = Date.now();
    const lastAt = lastSentToJuceAt.get(key) ?? 0;
    if (THROTTLED_JUCE_KEYS.has(key) && isEmbeddedRuntime()) {
      // Embedded plugin stability: don't write large keys while the UI is active.
      // Instead, keep only the latest value and flush it when the WebView is hidden/unloaded.
      pendingJuceSaveValue.set(key, juceValue);

      // If the host is already hiding us, flush immediately.
      try {
        if (typeof document !== 'undefined' && document.hidden) {
          flushPendingJuceSaves();
          return true;
        }
      } catch {}

      // Otherwise schedule a very lazy flush (acts as a safety net).
      const existingTimer = pendingJuceSaveTimer.get(key);
      if (existingTimer) {
        try {
          window.clearTimeout(existingTimer);
        } catch {}
      }
      const t = window.setTimeout(() => {
        flushPendingJuceSaves();
      }, 15000);
      pendingJuceSaveTimer.set(key, t);
      return true;
    }

    // Non-embedded: cheap throttle is fine.
    if (THROTTLED_JUCE_KEYS.has(key) && now - lastAt < 3500) {
      return true;
    }

    // If we already sent the same value very recently, skip.
    const lastVal = lastSentToJuceValue.get(key);
    if (typeof lastVal === 'string' && lastVal === juceValue && now - lastAt < 15000) {
      return true;
    }

    if (IS_DEV) {
      console.log('[Storage] 🔄 Saving to JUCE PropertiesFile:', key, `value length: ${value.length}`);
      console.log('[Storage] 📦 Value preview (first 100 chars):', value.substring(0, 100));
      console.log('[Storage] 🔍 Checking window.saveToJuce...');
      console.log('[Storage] 🔍 window exists?', typeof window !== 'undefined');
      console.log('[Storage] 🔍 window.saveToJuce exists?', typeof (window as any)?.saveToJuce !== 'undefined');
      console.log('[Storage] 🔍 window.saveToJuce type:', typeof (window as any)?.saveToJuce);
    }
    
    if (typeof window !== 'undefined' && (window as any).saveToJuce) {
      if (IS_DEV) {
        console.log('[Storage] ✅ window.saveToJuce is available, calling it NOW...');
        console.log('[Storage] 📞 Calling saveToJuce with key:', key, 'value length:', value.length);
      }
      (window as any).saveToJuce(key, juceValue);
      lastSentToJuceAt.set(key, now);
      lastSentToJuceValue.set(key, juceValue);
      if (IS_DEV) console.log('[Storage] ✅ saveToJuce called for:', key);
    } else {
      if (IS_DEV) {
        console.error('[Storage] ❌ window.saveToJuce NOT AVAILABLE!');
        console.error('[Storage] ❌ window object:', typeof window);
        console.error('[Storage] ❌ window.saveToJuce type:', typeof (window as any)?.saveToJuce);
        console.error('[Storage] ❌ This means juceBridge.ts was not loaded or onJuceInit was not called!');
      }
    }
  } catch (error) {
    // Keep error log even in prod; persistence failures are important.
    console.error('[Storage] ❌ JUCE saveToJuce failed:', error);
  }

  // Also save to localStorage as cache (but don't rely on it)
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.setItem(key, value);
      if (IS_DEV) console.log('[Storage] ✅ Saved to localStorage cache:', key);
    } catch (error) {
      if (IS_DEV) console.warn('[Storage] ⚠️ localStorage.setItem failed:', error);
    }
  }

  // Notify app/components immediately (used for reacting to selected project changes, etc.)
  if (typeof window !== 'undefined') {
    try {
      if (NO_DISPATCH_KEYS.has(key)) {
        return true;
      }
      window.dispatchEvent(new CustomEvent('sairyne-data-loaded', {
        detail: { key, value }
      }));
    } catch {}
  }
  
  // Data is in memory and sent to JUCE, so return true
  return true;
}

/**
 * Safe localStorage.removeItem with error handling
 */
export function safeRemoveItem(key: string): boolean {
  // Always clear memory cache.
  memoryStorage.delete(key);
  if (typeof window !== 'undefined' && (window as any).__sairyneStorage) {
    try {
      (window as any).__sairyneStorage.delete(key);
    } catch {}
  }

  try {
    if (isLocalStorageAvailable()) {
      window.localStorage.removeItem(key);
    }

    // Clear persisted value in JUCE as well by writing empty string
    try {
      if (typeof window !== 'undefined' && (window as any).saveToJuce) {
        (window as any).saveToJuce(key, '');
      }
    } catch {}

    // Notify listeners that key was cleared
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('sairyne-data-loaded', {
          detail: { key, value: '' }
        }));
      } catch {}
    }
    return true;
  } catch (error) {
    return false;
  }
}

