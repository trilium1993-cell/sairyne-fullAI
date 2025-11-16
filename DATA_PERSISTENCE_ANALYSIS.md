# 📊 Data Persistence Implementation Analysis

## 1. JS ↔ C++ WebView Bridge Implementation

### ✅ **YES - Bridge is implemented**

**Bridge Functions (JS → C++):**
- `saveDataToJuce(key: string, value: string)` - Sends save request
- `loadDataFromJuce(key: string)` - Sends load request
- `openUrlInSystemBrowser(url: string)` - Opens URLs in system browser

**Events from JS to C++:**
- `saveData` - Via `withEventListener` in `HashReportingWebBrowser` constructor
- `loadData` - Via `withEventListener` in `HashReportingWebBrowser` constructor
- `openUrl` - Via `withEventListener` in `HashReportingWebBrowser` constructor
- `sairyneResize` - For window resizing

**Callbacks from C++ to JS:**
- `data_loaded` - Sent via custom scheme URL `sairyne://data_loaded?key=...&value=...`
- Wrapper script detects URL change and calls `window.onJuceDataLoaded(key, value)`
- Frontend subscribes via `onDataLoaded()` callback

**Communication Methods Attempted:**
1. **Custom Scheme URLs** (`sairyne://save_data?key=...&value=...`)
   - Handled by `handleCustomScheme()` in `pageAboutToLoad()` and `newWindowAttemptingToLoad()`
2. **Event Listeners** (`withEventListener` for `saveData`/`loadData`)
   - Handled by `handleSaveDataEvent()` and `handleLoadDataEvent()`
3. **postMessage** (iframe → wrapper)
   - Wrapper script listens for `postMessage` and converts to custom scheme URLs
4. **window.open** (with custom scheme)
   - Should trigger `newWindowAttemptingToLoad()`

---

## 2. JUCE Storage Implementation

### ✅ **YES - PropertiesFile is implemented**

**Storage Type:** `juce::PropertiesFile`

**Location:**
- macOS: `~/Library/Application Support/Sairyne/Sairyne.settings`
- Format: XML (via `StorageFormat::storeAsXML`)

**Implementation Details:**
- Created lazily in `getPropertiesFile()` method
- Options configured:
  - `applicationName = "Sairyne"`
  - `filenameSuffix = "settings"`
  - `osxLibrarySubFolder = "Application Support"`
  - `millisecondsBeforeSaving = 2000` (auto-save delay)
  - `doNotSave = false` (saves automatically)

**Persistence:**
- ✅ **YES** - Data is saved to disk and persists after DAW restart
- File is created when first `setValue()` is called
- Auto-saves after 2 seconds of inactivity

**Save Operation:**
```cpp
props->setValue(key, value);
props->saveIfNeeded(); // Saves to disk
```

**Load Operation:**
```cpp
auto value = props->getValue(key, ""); // Returns empty string if not found
```

---

## 3. Connection with WebView UI on Plugin Load

### ⚠️ **PARTIALLY IMPLEMENTED - Missing Critical Step**

**What EXISTS:**
- `App.tsx` has a `useEffect` that attempts to load data on startup
- Only loads if `localStorage` is NOT available
- Subscribes to `onDataLoaded()` events
- Requests keys: `sairyne_users`, `sairyne_current_user`, `sairyne_access_token`, `sairyne_projects`, `sairyne_selected_project`

**What's MISSING:**
- ❌ **NO `executeJavaScript()` call to preload saved data into the web app**
- ❌ **NO automatic data injection on plugin load**
- ❌ **Data loading only happens if localStorage is unavailable** (should always load from JUCE first)

**Current Flow:**
1. Plugin loads → WebView loads HTML
2. `App.tsx` checks if `localStorage` is available
3. If NOT available → requests data from JUCE
4. Data arrives via `data_loaded` event → stored in memory and localStorage
5. **Problem:** If localStorage IS available, JUCE data is never loaded!

---

## 4. Why Current System Does NOT Save Email/Password/Projects

### 🔍 **Root Cause Analysis**

**Problem 1: Messages Not Reaching JUCE**
- Logs show NO `sairyne://save_data` URLs in `pageAboutToLoad` or `newWindowAttemptingToLoad`
- This means:
  - `window.open()` is blocked or not triggering `newWindowAttemptingToLoad()`
  - `postMessage` from iframe is not reaching wrapper
  - `location.href` changes are not propagating from iframe to wrapper

**Problem 2: WebView localStorage Status Unknown**
- Code assumes localStorage might be blocked, but we don't know if it actually works
- If localStorage DOES work, JUCE fallback is never used
- If localStorage DOESN'T work, messages aren't reaching JUCE

**Problem 3: Event Listeners Not Firing**
- `handleSaveDataEvent()` and `handleLoadDataEvent()` are never called
- This suggests `withEventListener` is not receiving events from JS
- Helper script attempts to use `bridge.emitEvent()` but it may not be available

**Problem 4: Data Loading Logic Flaw**
- `App.tsx` only loads from JUCE if `localStorage` is unavailable
- Should ALWAYS load from JUCE first, then fallback to localStorage

**Problem 5: No Initial Data Injection**
- Even if data is saved to JUCE, it's never injected into the web app on startup
- Need `executeJavaScript()` to call `window.onJuceDataLoaded()` with saved data

---

## 5. Files Containing Persistence Logic

### C++ Plugin Code:
1. **`PluginProcessor.h`**
   - Declares `getPropertiesFile()` method
   - Declares `propertiesFile` member variable

2. **`PluginProcessor.cpp`**
   - Implements `getPropertiesFile()` (creates PropertiesFile)
   - `HashReportingWebBrowser` class:
     - `handleCustomScheme()` - Handles `sairyne://save_data` and `sairyne://load_data` URLs
     - `handleSaveDataEvent()` - Handles `saveData` events from JS bridge
     - `handleLoadDataEvent()` - Handles `loadData` events from JS bridge
     - `pageAboutToLoad()` - Intercepts URL changes
     - `newWindowAttemptingToLoad()` - Intercepts window.open() calls
   - Helper script (injected JavaScript) - Attempts to intercept `postMessage` and convert to custom scheme URLs
   - Wrapper script - Listens for `postMessage` from iframe and sets `location.href`

### WebView Bridge Files:
3. **`src/services/audio/juceBridge.ts`**
   - `saveDataToJuce()` - Sends save request (3 methods: window.open, postMessage, location.href)
   - `loadDataFromJuce()` - Sends load request (3 methods: window.open, postMessage, location.href)
   - `onDataLoaded()` - Subscribes to data loaded events
   - `isJuceAvailable()` - Checks if JUCE bridge is available

### Storage Utilities:
4. **`src/utils/storage.ts`**
   - `safeSetItem()` - Wraps localStorage.setItem, falls back to JUCE
   - `safeGetItem()` - Wraps localStorage.getItem, falls back to JUCE
   - `isLocalStorageAvailable()` - Tests if localStorage works
   - `memoryStorage` - In-memory Map for immediate access

### Application Code:
5. **`src/App.tsx`**
   - `useEffect` hook that loads data from JUCE on startup (only if localStorage unavailable)
   - Subscribes to `onDataLoaded()` events
   - Stores loaded data in `window.__sairyneStorage` Map

### Service Files:
6. **`src/services/auth.ts`**
   - Uses `safeSetItem()` and `safeGetItem()` for user data
   - Keys: `sairyne_users`, `sairyne_current_user`, `sairyne_access_token`

7. **`src/services/projects.ts`**
   - Uses `safeSetItem()` and `safeGetItem()` for project data
   - Keys: `sairyne_projects`, `sairyne_selected_project`

---

## 6. Summary: What Works vs. What's Missing

### ✅ **What Works Today:**

1. **JUCE Storage Infrastructure:**
   - PropertiesFile is fully implemented and functional
   - Saves to `~/Library/Application Support/Sairyne/Sairyne.settings`
   - Persists across DAW restarts
   - Auto-saves after 2 seconds

2. **C++ Event Handlers:**
   - `handleCustomScheme()` correctly parses `sairyne://save_data` and `sairyne://load_data` URLs
   - `handleSaveDataEvent()` and `handleLoadDataEvent()` are implemented
   - Both methods correctly save/load from PropertiesFile

3. **Frontend Storage Abstraction:**
   - `safeSetItem()` and `safeGetItem()` provide unified API
   - In-memory storage for immediate access
   - Fallback logic is in place

4. **Data Loading Infrastructure:**
   - `onDataLoaded()` callback system exists
   - `App.tsx` has loading logic (though conditional)

### ❌ **What's Missing:**

1. **Message Delivery:**
   - **CRITICAL:** Messages from JS are NOT reaching JUCE
   - No `sairyne://save_data` URLs appear in logs
   - `window.open()`, `postMessage`, and `location.href` methods all fail silently
   - Need to verify if WebView allows custom scheme navigation

2. **Initial Data Injection:**
   - **CRITICAL:** No `executeJavaScript()` call on plugin load to inject saved data
   - Even if data is saved, it's never loaded into the web app on startup
   - Need to read all PropertiesFile keys and inject via JavaScript

3. **Data Loading Logic:**
   - `App.tsx` only loads from JUCE if localStorage is unavailable
   - Should ALWAYS load from JUCE first, then use localStorage as cache
   - Current logic prevents JUCE data from being used if localStorage works

4. **Event Listener Verification:**
   - `withEventListener` may not be working correctly
   - `handleSaveDataEvent()` and `handleLoadDataEvent()` are never called
   - Need to verify if JUCE WebBrowserComponent supports event listeners

5. **Helper Script Execution:**
   - Helper script attempts to intercept `postMessage` but may not be executing
   - Wrapper script may not be receiving messages from iframe
   - Need to verify if scripts are actually running in WebView context

---

## 🎯 **Conclusion:**

**The storage infrastructure is complete and functional on the C++ side, but the communication layer between JS and C++ is broken. Messages are not reaching JUCE, and even if they were, there's no mechanism to inject saved data back into the web app on startup. The system needs: (1) a working message delivery mechanism (possibly via `executeJavaScript()` to call a C++ function directly), (2) initial data injection on plugin load, and (3) logic to always load from JUCE first regardless of localStorage availability.**

