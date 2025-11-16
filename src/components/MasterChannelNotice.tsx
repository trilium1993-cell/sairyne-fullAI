import { useEffect, useState } from "react";

const STORAGE_KEY = "sairyne_master_notice_v2";

export function MasterChannelNotice(): JSX.Element | null {
  const [visible, setVisible] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    // Check if embedded - try multiple methods for WebView compatibility
    const embedded = 
      document.body?.dataset.embed === "true" ||
      window.self !== window.top ||
      window.location.pathname?.toLowerCase().includes("embed-chat") ||
      window.location.search?.toLowerCase().includes("embed=1");

    setIsEmbedded(embedded);
    
    // Show notice for embedded or on production embed-chat page
    const shouldShowNotice = embedded || window.location.pathname?.toLowerCase().includes("embed-chat");
    
    if (!shouldShowNotice) {
      return;
    }

    // Check localStorage with error handling
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== "1") {
        setVisible(true);
      }
    } catch (error) {
      // If localStorage is blocked, show the notice anyway
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
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[1200] flex w-full max-w-[460px] -translate-x-1/2 justify-center px-4">
      <div className="pointer-events-auto w-full rounded-2xl border border-white/10 bg-[#1f1b2e] px-5 py-4 shadow-xl shadow-black/40">
        <div className="flex items-start gap-3">
          <div className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-[#ffb347]" />
          <div className="flex-1 text-left text-sm text-white/85">
            <p className="font-medium text-white">
              Tip: place Sairyne on the Master bus
            </p>
            <p className="mt-1 text-xs text-white/70">
              Sairyne works on any track, but you get the most accurate analysis from the Master channel mixdown.
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleDismiss}
            className="rounded-md bg-gradient-to-r from-[#7322b6] to-[#530c8d] px-3.5 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-[1.02]"
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
}
