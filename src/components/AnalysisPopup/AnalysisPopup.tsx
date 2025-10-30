import React, { useEffect, useRef } from 'react';

interface AnalysisOption {
  id: string;
  title: string;
  description: string;
}

const analysisOptions: AnalysisOption[] = [
  {
    id: "show-last",
    title: "Show last analysis summary",
    description: "View your previous analysis results and recommendations"
  },
  {
    id: "reanalysis",
    title: "Reanalysis project",
    description: "Run a fresh analysis of your current project"
  }
];

interface AnalysisPopupProps {
  isVisible: boolean;
  onClose: () => void;
  onShowLastAnalysis: () => void;
  onReanalysis: () => void;
}

const AnalysisPopup: React.FC<AnalysisPopupProps> = ({
  isVisible,
  onClose,
  onShowLastAnalysis,
  onReanalysis
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleOptionClick = (optionId: string) => {
    if (optionId === "show-last") {
      onShowLastAnalysis();
    } else if (optionId === "reanalysis") {
      onReanalysis();
    }
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent, optionId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOptionClick(optionId);
    }
  };

  // Обработка клика вне окна
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-12 right-2 z-50">
      <div className="relative" ref={modalRef}>
        {/* Analysis Options Frame */}
        <div
          className="flex flex-col w-72 items-start gap-3 pt-3.5 pb-[18px] px-4 relative bg-[#110a17] rounded-md border-[0.5px] border-solid border-[#e8ceff30]"
          data-model-id="analysis-options"
          role="radiogroup"
          aria-labelledby="analysis-options-label"
        >
          <div
            id="analysis-options-label"
            className="relative w-fit mt-[-0.50px] [font-family:'DM_Sans',Helvetica] font-light text-[#ffffff80] text-[10px] tracking-[0.70px] leading-[13px] whitespace-nowrap"
          >
            ANALYSIS OPTIONS
          </div>

          <div className="flex flex-col items-start gap-[11px] relative self-stretch w-full">
            {analysisOptions.map((option) => (
              <div
                key={option.id}
                className="h-[49px] relative self-stretch w-full hover:bg-[#ffffff08] rounded-md transition-colors cursor-pointer"
                onClick={() => handleOptionClick(option.id)}
                onKeyDown={(e) => handleKeyDown(e, option.id)}
                role="button"
                tabIndex={0}
              >
                <label
                  htmlFor={`option-${option.id}`}
                  className="absolute top-0 left-[22px] [font-family:'DM_Sans',Helvetica] font-medium text-white text-[11px] tracking-[0] leading-[17px] whitespace-nowrap cursor-pointer"
                >
                  {option.title}
                </label>

                <p className="absolute top-[calc(50.00%_-_6px)] left-[22px] w-[230px] [font-family:'DM_Sans',Helvetica] font-light text-[#ffffff80] text-[10px] tracking-[0] leading-[15px]">
                  {option.description}
                </p>

                <input
                  type="radio"
                  id={`option-${option.id}`}
                  name="analysis-option"
                  value={option.id}
                  className="sr-only"
                  aria-label={`${option.title}: ${option.description}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPopup;
