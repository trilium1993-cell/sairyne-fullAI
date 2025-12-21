/**
 * Storage utility with WebView compatibility
 * Always uses JUCE for persistence, localStorage is only a UI cache
 */

const IS_DEV = Boolean((import.meta as any)?.env?.DEV);

// In-memory storage as fallback when localStorage is not available
const memoryStorage: Map<string, string> = new Map();

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
  // Always store in memory first (for immediate access)
  memoryStorage.set(key, value);
  if (IS_DEV) {
    console.log('[Storage] ✅ Stored in memory:', key, `value length: ${value.length}`);
    console.log('[Storage] 🔍 Key type:', key);
    console.log('[Storage] 🔍 Is sairyne_users?', key === 'sairyne_users');
    console.log('[Storage] 🔍 Is sairyne_projects?', key === 'sairyne_projects');
  }

  // ALWAYS save to JUCE (this is the source of truth)
  try {
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
      (window as any).saveToJuce(key, value);
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

