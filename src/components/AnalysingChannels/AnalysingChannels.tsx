import React from "react";
import closeIcon from '../../assets/img/vector.svg';

interface AnalysingChannelsProps {
  onCancelAnalysis?: () => void;
  onClose?: () => void;
}

export const AnalysingChannels = ({ onCancelAnalysis, onClose }: AnalysingChannelsProps): JSX.Element => {
  return (
    <div className="w-full h-full relative">
      {/* Project Analysis Header */}
      <header className="absolute top-0 left-0 w-[383px] h-10 bg-[#14141447] backdrop-blur-xl backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(24px)_brightness(100%)]">
        <div className="absolute top-[10px] left-0 right-0 flex items-center justify-center px-3 h-5">
          {/* Close button in left corner */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute left-3 w-5 h-5 flex items-center justify-center hover:opacity-80 transition-opacity"
              aria-label="Close analysis"
            >
              <img
                className="w-[14px] h-[14px]"
                alt="Close"
                src={closeIcon}
              />
            </button>
          )}
          
          <h1 className="[font-family:'DM_Sans',Helvetica] font-medium text-white text-[13px] tracking-[0] leading-[normal]">
            Project Analysis
          </h1>
        </div>

        <img
          className="absolute top-[39px] left-[calc(50.00%_-_188px)] w-[383px] h-px object-cover"
          alt=""
          src="https://c.animaapp.com/WuobRfE5/img/line-21-1.svg"
          aria-hidden="true"
        />
      </header>

      <p className="absolute top-[454px] left-[calc(50.00%_-_148px)] w-[297px] font-helper font-[number:var(--helper-font-weight)] text-[#ffffff8f] text-[length:var(--helper-font-size)] text-center tracking-[var(--helper-letter-spacing)] leading-[var(--helper-line-height)] [font-style:var(--helper-font-style)]">
        Please, don&apos;t close the Ableton and Sairyne while analysis is
        in progress.
      </p>

      <h2 className="absolute top-[410px] left-[calc(50.00%_-_166px)] w-[331px] font-h3 font-[number:var(--h3-font-weight)] text-[#f7efff] text-[length:var(--h3-font-size)] text-center tracking-[var(--h3-letter-spacing)] leading-[var(--h3-line-height)] [font-style:var(--h3-font-style)]">
        Analyzing you channels...
      </h2>

      <button 
        onClick={onCancelAnalysis}
        className="flex w-[318px] h-10 items-center justify-center gap-2.5 px-2.5 py-[7px] absolute top-[734px] left-[calc(50.00%_-_158px)] rounded-[36px] border border-solid border-[#ffffff24] cursor-pointer">
        <img
          className="relative w-3.5 h-3.5"
          alt=""
          src="https://c.animaapp.com/WuobRfE5/img/close-3.svg"
        />

        <span className="relative w-fit font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] text-center tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] whitespace-nowrap [font-style:var(--body-font-style)]">
          Cancel analysis
        </span>
      </button>

      <div 
        className="absolute top-[271px] left-[135px] w-[114px] h-[114px] animate-spin"
        style={{ animationDuration: '3s' }}
      >
        <img
          className="w-full h-full"
          alt=""
          src="https://c.animaapp.com/WuobRfE5/img/ellipse-14.svg"
          aria-hidden="true"
          style={{
            maskImage: 'conic-gradient(from 0deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,1) 60%, rgba(0,0,0,1) 80%, rgba(0,0,0,0.7) 90%, rgba(0,0,0,0.3) 95%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'conic-gradient(from 0deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,1) 60%, rgba(0,0,0,1) 80%, rgba(0,0,0,0.7) 90%, rgba(0,0,0,0.3) 95%, rgba(0,0,0,0) 100%)',
            maskComposite: 'source-in'
          }}
        />
      </div>

      <div className="absolute top-[274px] left-[calc(50.00%_-_54px)] w-[108px] h-[108px] flex bg-[#7343aa59] rounded-[200px] backdrop-blur-[2.0px] backdrop-brightness-[80%] backdrop-saturate-[100.0%] [-webkit-backdrop-filter:blur(2.0px)_brightness(80%)_saturate(100.0%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_1px_0_0_rgba(255,255,255,0.12),inset_0_-1px_1px_rgba(0,0,0,0.13),inset_-1px_0_1px_rgba(0,0,0,0.11)]">
        <img
          className="mt-[9px] w-[90px] h-[90px] ml-[9px] aspect-[1] animate-pulse"
          alt="Analyzing waveform"
          src="https://c.animaapp.com/WuobRfE5/img/rectangle@2x.png"
          style={{
            animation: 'heartbeat 2s ease-in-out infinite'
          }}
        />
      </div>
      
      <style>{`
        @keyframes heartbeat {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }
      `}</style>
    </div>
  );
};
