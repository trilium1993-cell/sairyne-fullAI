import { useEffect, useState } from "react";

const STORAGE_KEY = "sairyne_master_notice_v2";

export function MasterChannelNotice(): JSX.Element | null {
  const [visible, setVisible] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    console.log('[MasterChannelNotice] Initializing, pathname:', window.location.pathname);

    // Check if embedded - try multiple methods for WebView compatibility
    const embedded = 
      document.body?.dataset.embed === "true" ||
      window.self !== window.top ||
      window.location.pathname?.toLowerCase().includes("embed-chat") ||
      window.location.search?.toLowerCase().includes("embed=1");

    console.log('[MasterChannelNotice] Embedded check:', embedded);
    setIsEmbedded(embedded);
    
    // Show notice for embedded or on any page (not restricted to embed-chat)
    const shouldShowNotice = true; // Always show on embedded pages
    
    if (!shouldShowNotice) {
      console.log('[MasterChannelNotice] shouldShowNotice is false, not showing');
      return;
    }

    console.log('[MasterChannelNotice] Checking localStorage...');
    
    // Check localStorage with error handling - if already dismissed, don't show
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      console.log('[MasterChannelNotice] Storage value:', stored);
      
      if (stored === "1") {
        console.log('[MasterChannelNotice] Already dismissed, not showing');
        return;
      }
      
      console.log('[MasterChannelNotice] Showing notice');
      setVisible(true);
    } catch (error) {
      // If localStorage is blocked, show the notice anyway
      console.log('[MasterChannelNotice] localStorage error, showing anyway:', error);
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } catch (error) {
        // localStorage may be blocked, ignore
      }
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[1200] flex -translate-x-1/2 justify-center" style={{ maxWidth: '340px', width: 'calc(100% - 20px)' }}>
      <div className="pointer-events-auto w-full rounded-2xl border border-white/10 bg-[#1f1b2e] px-4 py-3 shadow-xl shadow-black/40">
        <div className="flex items-start gap-2">
          <div className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-[#ffb347]" />
          <div className="flex-1 text-left">
            <p className="font-medium text-white text-xs">
              Tip: place Sairyne on the Master bus
            </p>
            <p className="mt-1 text-xs text-white/70 leading-tight">
              Works best on Master channel for accurate analysis.
            </p>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleDismiss}
            className="rounded-md bg-gradient-to-r from-[#7322b6] to-[#530c8d] px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-[1.02]"
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
}
