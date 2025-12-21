import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScreenManager from "./components/ScreenManager";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RegisterPlugin } from "./screens/RegisterPlugin";
import { applyEmbedFlagToBody } from "./utils/embed";
import "../tailwind.css";
import { MasterChannelNotice } from "./components/MasterChannelNotice";
import { loadDataFromJuce, onDataLoaded, isJuceAvailable } from "./services/audio/juceBridge";
import { isLocalStorageAvailable } from "./utils/storage";

function App() {
  useEffect(() => {
    applyEmbedFlagToBody();
    return () => {
      if (typeof document !== "undefined") {
        document.body.removeAttribute("data-embed");
      }
    };
  }, []);

  // Prevent Backspace from navigating WebView history (can blank the plugin UI) when not typing in an input.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Backspace") return;
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || "").toLowerCase();
      const isEditable =
        tag === "input" ||
        tag === "textarea" ||
        Boolean((target as any)?.isContentEditable);
      if (!isEditable) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, []);

  // Subscribe to data loaded events (data will be injected by C++ via onJuceInit or onJuceDataLoaded)
  useEffect(() => {
    // Listen for postMessage from wrapper (for juce_init and juce_data_loaded)
    const handleMessage = (event: MessageEvent) => {
      console.log('[App] 📨 Message received:', event.data ? (typeof event.data === 'object' ? JSON.stringify(event.data).substring(0, 200) : event.data) : 'no data');
      
      if (event.data && typeof event.data === 'object') {
        // Handle juce_init (injected on plugin startup)
        if (event.data.type === 'juce_init' && event.data.data) {
          console.log('[App] 📥 Received juce_init via postMessage with', Object.keys(event.data.data).length, 'keys');
          console.log('[App] 📥 Keys:', Object.keys(event.data.data).join(', '));
          if ((window as any).onJuceInit && typeof (window as any).onJuceInit === 'function') {
            console.log('[App] ✅ Calling window.onJuceInit...');
            (window as any).onJuceInit(event.data.data);
            console.log('[App] ✅ window.onJuceInit completed');
          } else {
            console.warn('[App] ⚠️ window.onJuceInit not available');
          }
        }
        // Handle juce_data_loaded (individual key loaded)
        else if (event.data.type === 'juce_data_loaded' && event.data.key && event.data.value) {
          console.log('[App] 📥 Received juce_data_loaded via postMessage:', event.data.key, `value length: ${event.data.value.length}`);
          if ((window as any).onJuceDataLoaded && typeof (window as any).onJuceDataLoaded === 'function') {
            (window as any).onJuceDataLoaded(event.data.key, event.data.value);
          }
        }
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleMessage);
    }
    
    // Subscribe to individual data loaded events (direct calls)
    const unsubscribe = onDataLoaded((payload: { key: string; value: string }) => {
      console.log('[App] Data loaded from JUCE:', payload.key, `value length: ${payload.value.length}`);
      
      // Store in memory storage (accessible via safeGetItem)
      if (typeof window !== 'undefined') {
        if (!(window as any).__sairyneStorage) {
          (window as any).__sairyneStorage = new Map();
        }
        (window as any).__sairyneStorage.set(payload.key, payload.value);
      }
      
      // Also save to localStorage as cache
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          // IMPORTANT: runtime boot id must be runtime-only, never cached across host restarts.
          if (payload.key !== 'sairyne_runtime_boot_id') {
            window.localStorage.setItem(payload.key, payload.value);
          }
          console.log('[App] Saved to localStorage cache:', payload.key);
        } catch (e) {
          console.warn('[App] Failed to save to localStorage:', e);
        }
      }
      
      // Trigger a custom event to notify components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sairyne-data-loaded', {
          detail: { key: payload.key, value: payload.value }
        }));
      }
    });
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('message', handleMessage);
      }
      unsubscribe();
    };
  }, []);

  return (
    <Router>
      <ErrorBoundary componentName="App">
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0b0a0f'
        }}>
          <Routes>
            <Route path="/register" element={<RegisterPlugin />} />
            <Route path="*" element={
              <>
                <MasterChannelNotice />
                <ScreenManager />
              </>
            } />
          </Routes>
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
