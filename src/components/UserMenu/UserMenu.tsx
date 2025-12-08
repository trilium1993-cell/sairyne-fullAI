import { useEffect, useRef, useState } from "react";
import { openUrlInSystemBrowser } from "../../services/audio/juceBridge";
import { resolveIsEmbedded } from "../../utils/embed";

interface UserMenuProps {
  onClose?: () => void;
  isOpen?: boolean;
}

export const UserMenu = ({ onClose, isOpen = false }: UserMenuProps): JSX.Element | null => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showEulaModal, setShowEulaModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleLeaveFeedback = () => {
    const feedbackUrl = "https://docs.google.com/forms/d/e/1FAIpQLSeUkIn9y-ZyWIjv03umKLl8x-NcD-JIoTDOneHPmHTciu6VpQ/viewform?usp=dialog";
    const isEmbedded = resolveIsEmbedded();
    
    console.log('[UserMenu] Leave feedback clicked, isEmbedded:', isEmbedded);
    
    if (isEmbedded) {
      openUrlInSystemBrowser(feedbackUrl);
    } else {
      if (typeof window !== 'undefined') {
        window.open(feedbackUrl, '_blank');
      }
    }
    
    if (onClose) {
      onClose();
    }
  };

  const handleOpenWebsite = () => {
    const websiteUrl = 'https://www.sairyne.net';
    const isEmbedded = resolveIsEmbedded();
    
    console.log('[UserMenu] Sairyne Website clicked, isEmbedded:', isEmbedded);
    
    if (isEmbedded) {
      openUrlInSystemBrowser(websiteUrl);
    } else {
      if (typeof window !== 'undefined') {
        window.open(websiteUrl, '_blank');
      }
    }
    
    if (onClose) {
      onClose();
    }
  };

  const handleReportBug = () => {
    const subject = 'Sairyne Alpha Bug Report';
    const body = `
Bug Description:
[Please describe what went wrong]

Steps to Reproduce:
1. 
2. 
3. 

Expected Behavior:
[What should happen]

Actual Behavior:
[What actually happened]

System Info:
- OS: macOS / Windows
- DAW: [Logic Pro / Ableton / etc.]
- DAW Version: 
- Sairyne Version: Alpha

---
Thank you for reporting!
    `.trim();

    const mailtoUrl = `mailto:contact@sairyne.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    console.log('[UserMenu] Report bug clicked');
    
    if (typeof window !== 'undefined') {
      window.location.href = mailtoUrl;
    }
    
    if (onClose) {
      onClose();
    }
  };

  const handleShowEula = () => {
    console.log('[UserMenu] Show EULA clicked');
    setShowEulaModal(true);
  };

  const handleShowPrivacy = () => {
    console.log('[UserMenu] Show Privacy Policy clicked');
    setShowPrivacyModal(true);
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

  if (!isOpen && !showEulaModal && !showPrivacyModal) return null;

  return (
    <>
      {/* Main menu */}
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

              <div className="w-full h-[0.5px] bg-white/10 my-1" />

              <button
                onClick={handleShowEula}
                className="w-full text-left py-2.5 px-0 cursor-pointer hover:opacity-80 transition-opacity"
                role="menuitem"
              >
                <span className="[font-family:'DM_Sans',Helvetica] font-medium text-white/70 text-[12px] tracking-[0] leading-[18px] whitespace-nowrap">
                  EULA & Legal
                </span>
              </button>

              <button
                onClick={handleShowPrivacy}
                className="w-full text-left py-2.5 px-0 cursor-pointer hover:opacity-80 transition-opacity"
                role="menuitem"
              >
                <span className="[font-family:'DM_Sans',Helvetica] font-medium text-white/70 text-[12px] tracking-[0] leading-[18px] whitespace-nowrap">
                  Privacy Policy
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EULA Modal */}
      {showEulaModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur">
          <div className="relative w-[90%] max-w-2xl max-h-[80vh] bg-[#1a1a23] rounded-lg border border-white/10 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-white font-semibold">Sairyne EULA & Legal</h2>
              <button
                onClick={() => setShowEulaModal(false)}
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Content - scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="text-white/80 text-sm space-y-4 font-light leading-relaxed">
                <p><strong>Version 1.0 - Alpha Release</strong></p>
                
                <p>
                  This software is provided "AS IS" without warranties. By using Sairyne, you agree to:
                </p>

                <ul className="list-disc list-inside space-y-2 text-white/70">
                  <li>Use it only for personal or commercial music production</li>
                  <li>Not reverse engineer, copy, or distribute it</li>
                  <li>Accept that data loss may occur (keep backups)</li>
                  <li>That AI features require OpenAI integration (see their Privacy Policy)</li>
                  <li>That backend services may be unavailable or change</li>
                </ul>

                <p className="text-white/60 text-xs">
                  For the complete EULA, visit the full documentation.
                </p>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3 my-4">
                  <p className="text-yellow-200 text-xs">
                    <strong>Alpha Notice:</strong> This is an early version. Please report bugs via the "Report a bug" option.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 p-4 border-t border-white/10 justify-end">
              <button
                onClick={() => setShowEulaModal(false)}
                className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur">
          <div className="relative w-[90%] max-w-2xl max-h-[80vh] bg-[#1a1a23] rounded-lg border border-white/10 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-white font-semibold">Privacy Policy</h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Content - scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="text-white/80 text-sm space-y-4 font-light leading-relaxed">
                <p><strong>Last updated: December 2025</strong></p>
                
                <p>
                  We collect data to improve Sairyne and communicate with you about updates.
                </p>

                <h3 className="text-white font-semibold mt-4">Information We Collect</h3>
                <ul className="list-disc list-inside space-y-2 text-white/70">
                  <li>Contact data (email, messages you submit)</li>
                  <li>Usage data (device info, pages visited, timestamps)</li>
                  <li>Audio analysis data (sent to OpenAI for AI features)</li>
                </ul>

                <h3 className="text-white font-semibold mt-4">Your Rights</h3>
                <ul className="list-disc list-inside space-y-2 text-white/70">
                  <li>Access, correct, or delete your data</li>
                  <li>Opt out of marketing emails</li>
                  <li>Withdraw consent anytime</li>
                  <li>Lodge a complaint with your data protection authority</li>
                </ul>

                <h3 className="text-white font-semibold mt-4">Contact</h3>
                <p className="text-white/70">
                  Privacy questions? Email: <span className="text-white">contact@sairyne.com</span>
                </p>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 my-4">
                  <p className="text-blue-200 text-xs">
                    <strong>Important:</strong> When you use AI features, your data is sent to OpenAI. See their Privacy Policy: openai.com/privacy
                  </p>
                </div>

                <p className="text-white/60 text-xs">
                  For the complete Privacy Policy, see the full documentation.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 p-4 border-t border-white/10 justify-end">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
