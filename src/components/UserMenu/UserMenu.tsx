import { useEffect, useRef, useState } from "react";
import { openUrlInSystemBrowser } from "../../services/audio/juceBridge";
import { resolveIsEmbedded } from "../../utils/embed";
import { ResetDataConfirmation } from "../ResetDataConfirmation";
import { resetAllLocalData } from "../../services/support";

interface UserMenuProps {
  onClose?: () => void;
  isOpen?: boolean;
}

export const UserMenu = ({ onClose, isOpen = false }: UserMenuProps): JSX.Element | null => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showEULA, setShowEULA] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleLeaveFeedback = () => {
    const feedbackUrl = "https://docs.google.com/forms/d/e/1FAIpQLSeUkIn9y-ZyWIjv03umKLl8x-NcD-JIoTDOneHPmHTciu6VpQ/viewform?usp=dialog";
    // Always use bridge helper; AU (WKWebView) can block direct window.open.
    openUrlInSystemBrowser(feedbackUrl);
    
    if (onClose) {
      onClose();
    }
  };

  const handleReportBug = () => {
    const bugUrl = "https://docs.google.com/forms/d/e/1FAIpQLSebyIZvChtL_nXqKKedIufgs9tLT-fEnMGm43-48HGBKO36Zg/viewform?usp=dialog";
    // Always use bridge helper; AU (WKWebView) can block direct window.open.
    openUrlInSystemBrowser(bugUrl);
    
    if (onClose) {
      onClose();
    }
  };

  const handleOpenEULA = () => {
    console.log('[UserMenu] EULA clicked');
    setShowEULA(true);
    if (onClose) {
      onClose();
    }
  };

  const handleOpenWebsite = () => {
    const websiteUrl = 'https://www.sairyne.net';
    // Always use bridge helper; AU (WKWebView) can block direct window.open.
    openUrlInSystemBrowser(websiteUrl);
    
    if (onClose) {
      onClose();
    }
  };

  const handleResetLocalData = () => {
    setShowResetConfirm(true);
    if (onClose) onClose();
  };

  // Обработка клика вне окна
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        if (onClose) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Обработка нажатия Escape
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen && !showEULA) return null;

  return (
    <>
      {/* EULA Modal */}
      {showEULA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div 
            className="relative bg-[#110a17] rounded-lg border border-[#e8ceff30] p-6 w-[90%] max-w-[500px] max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowEULA(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title */}
            <h2 className="text-white text-lg font-medium mb-4 pr-8">
              End User License Agreement
            </h2>

            {/* Content */}
            <div className="text-white/80 text-sm space-y-4 mb-6">
              <div>
                <p className="font-medium text-white mb-2">Sairyne is owned and developed by</p>
                <p>ТОВ «Sairyne Tech» (Sairyne Tech LLC)</p>
              </div>

              <p>
                This EULA governs your use of the Sairyne software and related services. By accessing or using Sairyne, you agree to be bound by the terms of this EULA.
              </p>

              <div>
                <p className="font-medium text-white mb-2">Intellectual Property</p>
                <p>
                  All intellectual property rights to the Sairyne platform, branding, and software belong to ТОВ «Sairyne Tech» (Sairyne Tech LLC). You are granted a limited, non-transferable, revocable license to use the software in accordance with these terms.
                </p>
              </div>

              <div>
                <p className="font-medium text-white mb-2">Restrictions</p>
                <p>
                  Unauthorized copying, distribution, reverse engineering, or modification of the software is prohibited unless permitted by applicable law.
                </p>
              </div>

              <div>
                <p className="font-medium text-white mb-2">Contact</p>
                <p>For questions about licensing, please contact: <span className="text-purple-400">contact@sairyne.com</span></p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowEULA(false)}
              className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors font-medium"
            >
              Accept & Close
            </button>
          </div>
        </div>
      )}

      {/* User Menu */}
      {isOpen && (
        <div 
          className="absolute z-50" 
          style={{ 
            top: '48px', 
            right: '14px'
          }}
        >
      <div className="relative" ref={modalRef}>
        <div
          className="flex flex-col items-start gap-2.5 pt-4 pb-4 px-5 relative bg-[#110a17] rounded-md border-[0.5px] border-solid border-[#e8ceff30]"
          role="menu"
        >
          <button
            onClick={handleOpenWebsite}
            className="w-full text-left py-2.5 px-0 cursor-pointer hover:opacity-80 transition-opacity"
            role="menuitem"
          >
            <span className="[font-family:'DM_Sans',Helvetica] font-medium text-white text-[14px] tracking-[0] leading-[21px] whitespace-nowrap">
              Sairyne Website
            </span>
          </button>

          <button
            onClick={handleLeaveFeedback}
            className="w-full text-left py-2.5 px-0 cursor-pointer hover:opacity-80 transition-opacity"
            role="menuitem"
          >
            <span className="[font-family:'DM_Sans',Helvetica] font-medium text-white text-[14px] tracking-[0] leading-[21px] whitespace-nowrap">
              Leave feedback
            </span>
          </button>

          <button
            onClick={handleReportBug}
            className="w-full text-left py-2.5 px-0 cursor-pointer hover:opacity-80 transition-opacity"
            role="menuitem"
          >
            <span className="[font-family:'DM_Sans',Helvetica] font-medium text-white text-[14px] tracking-[0] leading-[21px] whitespace-nowrap">
              Report a bug
            </span>
          </button>

          <button
            onClick={handleOpenEULA}
            className="w-full text-left py-2.5 px-0 cursor-pointer hover:opacity-80 transition-opacity"
            role="menuitem"
          >
            <span className="[font-family:'DM_Sans',Helvetica] font-medium text-white text-[14px] tracking-[0] leading-[21px] whitespace-nowrap">
              EULA
            </span>
          </button>

          <div className="w-full h-px bg-[#ffffff14] my-1" />

          <button
            onClick={handleResetLocalData}
            className="w-full text-left py-2.5 px-0 cursor-pointer hover:opacity-80 transition-opacity"
            role="menuitem"
            type="button"
          >
            <span className="[font-family:'DM_Sans',Helvetica] font-medium text-red-400 text-[14px] tracking-[0] leading-[21px] whitespace-nowrap">
              Reset local data
            </span>
          </button>
        </div>
      </div>
    </div>
      )}

      <ResetDataConfirmation
        isVisible={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          resetAllLocalData();
        }}
      />
    </>
  );
};
