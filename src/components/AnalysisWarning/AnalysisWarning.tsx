import React, { useEffect, useRef } from "react";

interface AnalysisWarningProps {
  onClose?: () => void;
  isOpen?: boolean;
}

export const AnalysisWarning = ({ onClose, isOpen = false }: AnalysisWarningProps): JSX.Element | null => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Обработка клика вне окна
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        if (onClose) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-12 left-2 z-50">
      <div className="relative" ref={modalRef}>
        {/* Warning Frame */}
        <div
          className="flex flex-col w-72 items-center justify-center gap-3 pt-5 pb-5 px-6 relative bg-[#110a17] rounded-md border-[0.5px] border-solid border-[#e8ceff30]"
          role="alert"
        >
          <div className="relative w-fit text-center [font-family:'DM_Sans',Helvetica] font-medium text-white text-[13px] tracking-[0] leading-[18px]">
            First push 'Cancel Analysis'
          </div>
        </div>
      </div>
    </div>
  );
};

