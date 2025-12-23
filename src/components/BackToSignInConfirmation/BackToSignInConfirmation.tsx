import React, { useEffect, useRef } from 'react';

interface BackToSignInConfirmationProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const BackToSignInConfirmation: React.FC<BackToSignInConfirmationProps> = ({
  isVisible,
  onClose,
  onConfirm
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleConfirmClick = () => {
    onConfirm();
    onClose();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isVisible) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible, onClose]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isVisible) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative" ref={modalRef}>
        <div
          className="flex flex-col w-80 items-center gap-4 pt-6 pb-5 px-6 relative bg-[#110a17] rounded-md border-[0.5px] border-solid border-[#e8ceff30]"
          role="alertdialog"
          aria-labelledby="signout-title"
          aria-describedby="signout-description"
        >
          <h3
            id="signout-title"
            className="relative w-full text-center [font-family:'DM_Sans',Helvetica] font-medium text-white text-[15px] tracking-[0] leading-[20px]"
          >
            Return to Sign In?
          </h3>

          <p
            id="signout-description"
            className="relative w-full text-center [font-family:'DM_Sans',Helvetica] font-light text-[#ffffff80] text-[13px] tracking-[0] leading-[18px]"
          >
            You will be signed out and asked for your password again.
          </p>

          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onClose}
              className="flex-1 h-10 flex items-center justify-center px-4 py-2 bg-[#ffffff0d] hover:bg-[#ffffff14] rounded-[36px] border border-solid border-[#ffffff1c] transition-colors cursor-pointer"
              aria-label="Cancel"
              type="button"
            >
              <span className="[font-family:'DM_Sans',Helvetica] font-normal text-white text-[13px] tracking-[0] leading-[22px]">
                Cancel
              </span>
            </button>

            <button
              onClick={handleConfirmClick}
              className="flex-1 h-10 flex items-center justify-center px-4 py-2 bg-[linear-gradient(134deg,rgba(115,34,182,1)_0%,rgba(83,12,141,1)_100%)] hover:opacity-90 rounded-[36px] transition-opacity cursor-pointer"
              aria-label="Yes, sign out"
              type="button"
            >
              <span className="[font-family:'DM_Sans',Helvetica] font-normal text-white text-[13px] tracking-[0] leading-[22px]">
                Yes, sign out
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


