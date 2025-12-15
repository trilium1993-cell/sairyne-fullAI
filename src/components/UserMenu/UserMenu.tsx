import { useEffect, useRef } from "react";
import { openUrlInSystemBrowser } from "../../services/audio/juceBridge";
import { resolveIsEmbedded } from "../../utils/embed";

interface UserMenuProps {
  onClose?: () => void;
  isOpen?: boolean;
}

export const UserMenu = ({ onClose, isOpen = false }: UserMenuProps): JSX.Element | null => {
  const modalRef = useRef<HTMLDivElement>(null);

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

  if (!isOpen) return null;

  return (
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
        </div>
      </div>
    </div>
  );
};
