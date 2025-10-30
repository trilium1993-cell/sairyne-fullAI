import React, { useEffect, useRef } from "react";

// LearnMode component with persistent level selection

interface ProficiencyOption {
  id: string;
  title: string;
  description: string;
}

const proficiencyOptions: ProficiencyOption[] = [
  {
    id: "learn",
    title: "Learn Mode",
    description:
      "Detailed guidance for every Ableton feature. Perfect for beginners and those new to DAWs.",
  },
  {
    id: "create",
    title: "Create Mode",
    description:
      "Focused workflow guidance for advanced techniques. Assumes basic Ableton knowledge.",
  },
  {
    id: "pro",
    title: "Pro Mode",
    description:
      "Concise, technical advice with minimal hand-holding. Quick tips, advanced strategies, and industry-standard approaches for experienced producers.",
  },
];

interface LearnModeProps {
  onClose?: () => void;
  isOpen?: boolean;
  onLevelSelect?: (level: string) => void;
  selectedLevel?: string;
}

export const LearnMode = ({ onClose, isOpen = true, onLevelSelect, selectedLevel = "learn" }: LearnModeProps): JSX.Element => {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleModeChange = (modeId: string) => {
    if (onLevelSelect) {
      onLevelSelect(modeId);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, modeId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleModeChange(modeId);
    }
  };

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
        {/* LearnMode Frame */}
        <div
          className="flex flex-col w-72 items-start gap-3 pt-3.5 pb-[18px] px-4 relative bg-[#110a17] rounded-md border-[0.5px] border-solid border-[#e8ceff30]"
          data-model-id="363:1847"
          role="radiogroup"
          aria-labelledby="proficiency-level-label"
        >
        <div
          id="proficiency-level-label"
          className="relative w-fit mt-[-0.50px] [font-family:'DM_Sans',Helvetica] font-light text-[#ffffff80] text-[10px] tracking-[0.70px] leading-[13px] whitespace-nowrap"
        >
          PROFICIENCY LEVEL
        </div>

        <div className="flex flex-col h-[195px] items-start gap-[11px] relative self-stretch w-full">
          {proficiencyOptions.map((option) => (
            <div
              key={option.id}
              className="h-[49px] relative self-stretch w-full"
            >
              <label
                htmlFor={`mode-${option.id}`}
                className="absolute top-0 left-[22px] [font-family:'DM_Sans',Helvetica] font-medium text-white text-[11px] tracking-[0] leading-[17px] whitespace-nowrap cursor-pointer"
              >
                {option.title}
              </label>

              <p className="absolute top-[calc(50.00%_-_6px)] left-[22px] w-[230px] [font-family:'DM_Sans',Helvetica] font-light text-[#ffffff80] text-[10px] tracking-[0] leading-[15px]">
                {option.description}
              </p>

              <div
                className="flex absolute top-px left-0 w-[15px] h-[15px] rounded-[7.5px] border border-solid border-[#ffffff1f] cursor-pointer"
                onClick={() => handleModeChange(option.id)}
                onKeyDown={(e) => handleKeyDown(e, option.id)}
                role="radio"
                aria-checked={selectedLevel === option.id}
                aria-labelledby={`mode-${option.id}`}
                tabIndex={0}
              >
                {selectedLevel === option.id && (
                  <div className="mt-[3px] w-[9px] h-[9px] ml-[3px] bg-white rounded-[4.5px]" />
                )}
              </div>

              <input
                type="radio"
                id={`mode-${option.id}`}
                name="proficiency-mode"
                value={option.id}
                checked={selectedLevel === option.id}
                onChange={() => handleModeChange(option.id)}
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
