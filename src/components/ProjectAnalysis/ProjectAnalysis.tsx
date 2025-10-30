import React from "react";
import closeIcon from '../../assets/img/vector.svg';

interface ProjectAnalysisProps {
  onStartAnalysis?: () => void;
  onClose?: () => void;
}

export const ProjectAnalysis = ({ onStartAnalysis, onClose }: ProjectAnalysisProps): JSX.Element => {
  return (
    <div className="w-full h-full relative">
      {/* Project Analysis Header */}
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

      {/* Audio waveform visualization */}
      <img
        className="absolute top-[179px] left-[5px] w-[384px] h-[233px] aspect-[1.64]"
        alt="Audio waveform visualization"
        src="https://c.animaapp.com/VzlUQUIK/img/rectangle@2x.png"
        style={{
          animation: 'waveformPulse 2.5s ease-in-out infinite, waveformDistort 1.5s ease-in-out infinite'
        }}
      />
      
      <style>{`
        @keyframes waveformPulse {
          0%, 100% {
            transform: scale(1) scaleY(1);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.02) scaleY(1.05);
            opacity: 1;
          }
        }
        
        @keyframes waveformDistort {
          0%, 100% {
            filter: brightness(1) contrast(1);
            transform: scaleY(1);
          }
          25% {
            filter: brightness(1.1) contrast(1.05);
            transform: scaleY(1.03);
          }
          50% {
            filter: brightness(1) contrast(1);
            transform: scaleY(0.98);
          }
          75% {
            filter: brightness(1.05) contrast(1.03);
            transform: scaleY(1.02);
          }
        }
      `}</style>

      {/* Main heading */}
      <h3 className="absolute top-[420px] left-[calc(50.00%_-_166px)] w-[331px] font-h2 font-[number:var(--h2-font-weight)] text-[#f7efff] text-[length:var(--h2-font-size)] text-center tracking-[var(--h2-letter-spacing)] leading-[var(--h2-line-height)] [font-style:var(--h2-font-style)]">
        Let Sairyne analyze your track with advanced AI feature.
      </h3>

      {/* Description */}
      <p className="absolute top-[498px] left-[calc(50.00%_-_148px)] w-[297px] font-title font-[number:var(--title-font-weight)] text-[#ffffff8f] text-[length:var(--title-font-size)] text-center tracking-[var(--title-letter-spacing)] leading-[var(--title-line-height)] [font-style:var(--title-font-style)]">
        Your personal guide to effective and simple music creation process.
      </p>

      {/* Start analysis button */}
      <button 
        onClick={onStartAnalysis}
        className="flex w-[318px] h-10 items-center justify-center gap-2.5 px-2.5 py-[7px] absolute top-[566px] left-[calc(50.00%_-_158px)] rounded-[36px] border-[none] bg-[linear-gradient(134deg,rgba(115,34,182,1)_0%,rgba(83,12,141,1)_100%)] before:content-[''] before:absolute before:inset-0 before:p-px before:rounded-[36px] before:[background:linear-gradient(180deg,rgba(255,255,255,0.11)_0%,rgba(255,255,255,0.01)_100%)] before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:z-[1] before:pointer-events-none cursor-pointer hover:opacity-90 transition-opacity">
        <img
          className="relative w-4 h-4"
          alt=""
          src="https://c.animaapp.com/VzlUQUIK/img/waveform-light-1-1.svg"
        />

        <span className="relative w-fit font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] text-center tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] whitespace-nowrap [font-style:var(--body-font-style)]">
          Start project analysis
        </span>
      </button>

      {/* Footer note */}
      <div className="absolute w-[272px] h-[18px] top-[769px] left-14 flex justify-center">
        <div className="w-[274px] h-[18px] ml-0.5 relative">
          <img
            className="absolute top-1 left-[calc(50.00%_-_137px)] w-[13px] h-[13px]"
            alt=""
            src="https://c.animaapp.com/VzlUQUIK/img/play-fill-1.svg"
            aria-hidden="true"
          />

          <p className="absolute top-0 left-[calc(50.00%_-_116px)] font-helper font-[number:var(--helper-font-weight)] text-[#989699] text-[length:var(--helper-font-size)] text-center tracking-[var(--helper-letter-spacing)] leading-[var(--helper-line-height)] whitespace-nowrap [font-style:var(--helper-font-style)]">
            Your track will be playing while AI analyzing it.
          </p>
        </div>
      </div>
    </div>
  );
};