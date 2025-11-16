/**
 * Analysis Summary Component
 * Показывает результаты FFT анализа после завершения Analysing Channels
 */

import React, { useState } from "react";
import closeIcon from '../../assets/img/vector.svg';

interface IssueItem {
  text: string;
}

interface AnalysisSection {
  title: string;
  issues: IssueItem[];
}

interface AnalysisSummaryProps {
  onClose: () => void;
  onReanalyse: () => void;
  onFixIssues: (sectionTitle: string) => void;
  score?: number;
  summary?: string;
  sections?: AnalysisSection[];
}

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({
  onClose,
  onReanalyse,
  onFixIssues,
  score = 7.2,
  summary = "Solid foundation, needs mixing polish.",
  sections = [
    {
      title: "Critical Issues",
      issues: [
        { text: "Kick & Bass Frequency Clash - Both competing around 60-80Hz" },
        { text: "Lead Melody Too Quiet - Getting lost in the mix (-8dB difference)" },
      ],
    },
    {
      title: "Mixing Improvements",
      issues: [
        { text: "Hi-hats Too Bright - Harsh frequencies around 8kHz need taming" },
        { text: "Bassline Lacks Punch - Missing presence in 100-200Hz range" },
        { text: "Reverb on Kick - Creating muddiness in low-end" },
      ],
    },
    {
      title: "Arrangement Suggestions",
      issues: [
        { text: "Hi-hats Too Bright - Harsh frequencies around 8kHz need taming" },
        { text: "Bassline Lacks Punch - Missing presence in 100-200Hz range" },
        { text: "Reverb on Kick - Creating muddiness in low-end" },
      ],
    },
  ],
}) => {
  // State for checkboxes
  const [checkedSections, setCheckedSections] = React.useState<boolean[]>([false, false, false]);
  
  // State for reanalyse loading
  const [isReanalysing, setIsReanalysing] = useState(false);

  const handleCheckboxToggle = (index: number) => {
    setCheckedSections(prev => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  const handleReanalyseClick = () => {
    if (isReanalysing) return;
    
    setIsReanalysing(true);
    
    // Задержка 3 секунды
    setTimeout(() => {
      onReanalyse();
      setIsReanalysing(false);
    }, 3000);
  };
  const sectionPositions = [
    { top: "130px", contentTop: "164px", lineTop: "118px", buttonTop: "262px" },
    { top: "322px", contentTop: "356px", lineTop: "310px", buttonTop: "478px" },
    { top: "538px", contentTop: "572px", lineTop: "526px", buttonTop: "694px" },
  ];

  return (
    <section className="absolute top-0 left-0 w-[383px] h-[810px] overflow-hidden relative flex flex-col">
      {/* Header - как в ProjectAnalysis */}
      <header className="absolute top-0 left-0 w-[383px] h-10 bg-[#14141447] backdrop-blur-xl backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(24px)_brightness(100%)] z-20">
        <div className="absolute top-[10px] left-0 right-0 flex items-center justify-center px-3 h-5">
          {/* Close button in left corner */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute left-3 w-5 h-5 flex items-center justify-center hover:opacity-80 transition-opacity"
              aria-label="Close project analysis"
            >
              <img
                className="w-[14px] h-[14px]"
                alt="Close"
                src={closeIcon}
              />
            </button>
          )}
          
          <h2 className="[font-family:'DM_Sans',Helvetica] font-medium text-white text-[13px] tracking-[0] leading-[normal]">
            Project Analysis
          </h2>
        </div>

        {/* Horizontal line under header */}
        <div className="absolute top-[39px] left-0 w-[383px] h-[1px] bg-white/10" />
      </header>

      {/* Content wrapper - flex-grow with padding-bottom for sticky footer */}
      <div className="flex-grow relative pb-[70px] overflow-y-auto" style={{ marginTop: '40px' }}>
        {/* Analysis Summary Title */}
        <h3 className="absolute top-[15px] left-[27px] [font-family:'DM_Sans',Helvetica] font-semibold text-[#f7efff] text-[15px] tracking-[0] leading-[22px]">
          Analysis summary
        </h3>

      {/* Line after title */}
      <div className="absolute top-[49px] left-[27px] w-[329px] h-px bg-white/10" />

      {/* Overall Score */}
      <div className="absolute top-[61px] left-[27px] [font-family:'DM_Sans',Helvetica] font-medium text-white text-[13px] tracking-[0] leading-[22px] whitespace-nowrap">
        Overall Score: {score}/10
      </div>

      {/* Summary Text */}
      <p className="absolute top-[84px] left-[27px] [font-family:'DM_Sans',Helvetica] font-normal text-white text-[13px] tracking-[0] leading-[22px] whitespace-nowrap">
        {summary}
      </p>

      {/* Sections (Critical Issues, Mixing Improvements, Arrangement) */}
      {sections.map((section, index) => (
        <React.Fragment key={index}>
          {/* Line before section */}
          <div
            className="absolute left-[27px] w-[329px] h-px bg-white/10"
            style={{ top: sectionPositions[index].lineTop }}
          />

          {/* Section Title */}
          <div
            className="absolute left-[55px] [font-family:'DM_Sans',Helvetica] font-medium text-white text-[13px] tracking-[0] leading-[22px] whitespace-nowrap"
            style={{ top: sectionPositions[index].top }}
          >
            {section.title}
          </div>

          {/* Checkbox Icon */}
          <button
            onClick={() => handleCheckboxToggle(index)}
            className={`absolute left-[27px] w-3.5 h-3.5 rounded-[3px] border border-solid cursor-pointer transition-all flex items-center justify-center ${
              checkedSections[index]
                ? 'bg-[#7322b6] border-[#7322b6]'
                : 'bg-transparent border-[#ffffff4c] hover:border-[#ffffff80]'
            }`}
            style={{ top: sectionPositions[index].top }}
            aria-label={`Toggle ${sections[index].title}`}
          >
            {checkedSections[index] && (
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 5L4 7L8 3"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>

          {/* Issues List */}
          <p
            className="absolute left-[55px] w-[306px] [font-family:'DM_Sans',Helvetica] font-light text-white text-xs tracking-[0] leading-[18px]"
            style={{ top: sectionPositions[index].contentTop }}
          >
            {section.issues.map((issue, issueIndex) => (
              <React.Fragment key={issueIndex}>
                {issue.text}
                {issueIndex < section.issues.length - 1 && (
                  <>
                    <br />
                  </>
                )}
              </React.Fragment>
            ))}
          </p>

          {/* Fix Issues Button */}
          <button
            onClick={() => onFixIssues(section.title)}
            className="flex w-[302px] h-[33px] items-center justify-center gap-2.5 px-2.5 py-[7px] absolute left-[55px] rounded-[36px] border border-solid border-[#8c49c375] cursor-pointer transition-all duration-300 hover:bg-[linear-gradient(134deg,rgba(115,34,182,0.2)_0%,rgba(83,12,141,0.2)_100%)] hover:border-[#a855f7] hover:shadow-[0_0_12px_rgba(168,85,247,0.4)]"
            style={{ top: sectionPositions[index].buttonTop }}
            aria-label={`Fix issues for ${section.title}`}
          >
            <span className="relative w-fit [font-family:'DM_Sans',Helvetica] font-normal text-white text-[13px] text-center tracking-[0] leading-[22px] whitespace-nowrap">
              Fix issues
            </span>
          </button>
        </React.Fragment>
      ))}

      </div>

      {/* Footer с кнопкой Reanalyse - sticky bottom с непрозрачным фоном */}
      <footer className="sticky bottom-0 left-0 w-[383px] h-[58px] bg-[#141414] z-20 flex-shrink-0">
        {/* Horizontal line от края до края (укорочена слева) */}
        <div className="absolute top-0 left-[10px] w-[373px] h-px bg-white/10" />
        {/* Reanalyse Button */}
        <button
          onClick={handleReanalyseClick}
          disabled={isReanalysing}
          className={`flex h-[34px] w-[358px] absolute top-[12px] left-[17px] items-center justify-center gap-2.5 px-2.5 py-[7px] rounded-[36px] border-none transition-opacity before:content-[''] before:absolute before:inset-0 before:p-px before:rounded-[36px] before:[background:linear-gradient(180deg,rgba(255,255,255,0.11)_0%,rgba(255,255,255,0.01)_100%)] before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:z-[1] before:pointer-events-none ${
            isReanalysing 
              ? 'cursor-not-allowed opacity-70' 
              : 'cursor-pointer hover:opacity-90'
          }`}
          style={{
            background: 'linear-gradient(134deg, rgba(115,34,182,1) 0%, rgba(83,12,141,1) 100%)',
          }}
        >
          {isReanalysing && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="relative z-[2] animate-spin"
            >
              <path
                d="M2 8C2 4.686 4.686 2 8 2C11.314 2 14 4.686 14 8C14 11.314 11.314 14 8 14"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          )}

          <span className="relative z-[2] w-fit [font-family:'DM_Sans',Helvetica] font-normal text-white text-[13px] text-center tracking-[0] leading-[22px] whitespace-nowrap">
            {isReanalysing ? 'Reanalysing...' : 'Reanalyse project'}
          </span>
        </button>
      </footer>
    </section>
  );
};

export default AnalysisSummary;
