import React, { useState } from "react";
import { Window } from "../../components/Window";

interface WelcomeToSairyneProps {
  onNext: () => void;
  onBack: () => void;
}

interface FeatureItem {
  id: number;
  icon: string;
  text: string;
  alt: string;
}

export const WelcomeToSairyne = ({ onNext, onBack }: WelcomeToSairyneProps): JSX.Element => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const features: FeatureItem[] = [
    {
      id: 1,
      icon: "https://c.animaapp.com/im6KWSXf/img/1041e407-be86-426d-876d-c151704f8c31-1@2x.png",
      text: "Ask questions about Ableton - Sairyne explains everything",
      alt: "Question mark icon",
    },
    {
      id: 2,
      icon: "https://c.animaapp.com/im6KWSXf/img/ca4a5caa-8a57-49c1-b5b2-73039a08c781-1@2x.png",
      text: "Visual guides show you exactly what to do in the interface.",
      alt: "Visual guide icon",
    },
    {
      id: 3,
      icon: "https://c.animaapp.com/im6KWSXf/img/34b99edf-4571-4bbe-97d2-669a12c97e1b-1@2x.png",
      text: "Minimize button (top-right) - your progress saves automatically.",
      alt: "Minimize icon",
    },
  ];

  const handleCheckboxChange = () => {
    setDontShowAgain(!dontShowAgain);
  };

  const handleStartClick = () => {
    if (import.meta.env.DEV) {
      console.debug('[welcome] start clicked', { dontShowAgain });
    }
    onNext();
  };

  const handleCloseClick = () => {
    if (import.meta.env.DEV) {
      console.debug('[welcome] close clicked');
    }
  };

  const handleMinimizeClick = () => {
    if (import.meta.env.DEV) {
      console.debug('[welcome] minimize clicked');
    }
  };

  return (
    <Window
      title="Sairyne"
      onMinimize={handleMinimizeClick}
      onClose={handleCloseClick}
    >
      <main className="absolute top-[34px] left-[3px] w-[377px] h-[810px] bg-[#141414] rounded-[7px] overflow-hidden">
        <div
          className="absolute top-[calc(50.00%_-_429px)] left-[calc(50.00%_-_140px)] w-[278px] h-[278px] bg-[#6e24ab5e] rounded-[139px] blur-[122px]"
          aria-hidden="true"
        />

        <div className="absolute top-[94px] left-[calc(50.00%_-_42px)] w-[82px] h-[82px] flex bg-[#141414] rounded-[44.43px] overflow-hidden border border-solid border-[#9956c580]">
          <img
            className="w-[82px] h-[82px] aspect-[1]"
            alt="Sairyne logo"
            src="https://c.animaapp.com/im6KWSXf/img/photo-2025-10-18-23-33-13-1@2x.png"
          />
        </div>

        <h2 className="absolute top-[204px] left-[calc(50.00%_-_122px)] font-h1 font-[number:var(--h1-font-weight)] text-[#f7efff] text-[length:var(--h1-font-size)] text-center tracking-[var(--h1-letter-spacing)] leading-[var(--h1-line-height)] [font-style:var(--h1-font-style)]">
          Welcome to Sairyne
        </h2>

        <p
          id="welcome-description"
          className="absolute top-[262px] left-[calc(50.00%_-_148px)] w-[297px] font-title font-[number:var(--title-font-weight)] text-[#ffffff8f] text-[length:var(--title-font-size)] text-center tracking-[var(--title-letter-spacing)] leading-[var(--title-line-height)] [font-style:var(--title-font-style)]"
        >
          Your personal guide to effective and simple music creation process.
        </p>

        <section
          className="absolute top-[354px] left-[49px] w-[286px] h-[209px]"
          aria-label="Features"
        >
          {features.map((feature, index) => (
            <article
              key={feature.id}
              className="absolute"
              style={{ top: `${index * 77}px` }}
            >
              <div className="absolute top-0 left-0 w-[55px] h-[55px] flex items-center justify-center bg-[#1f1f1fb2] rounded-[8px_4px_8px_8px] border border-solid border-[#ffffff0f]">
                <img
                  className={
                    index === 0
                      ? "w-9 h-[33px] aspect-[1.1]"
                      : index === 1
                        ? "h-[42px] w-9 aspect-[0.86]"
                        : "w-[30px] h-[34px] aspect-[0.88]"
                  }
                  alt={feature.alt}
                  src={feature.icon}
                />
              </div>

              <p className="absolute top-2 left-[70px] w-[210px] font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)]">
                {feature.text}
              </p>
            </article>
          ))}
        </section>

        <button
          onClick={handleStartClick}
          className="flex w-[282px] h-10 items-center justify-center gap-2.5 px-2.5 py-[7px] absolute top-[604px] left-[calc(50.00%_-_142px)] rounded-[36px] border-[none] bg-[linear-gradient(134deg,rgba(115,34,182,1)_0%,rgba(83,12,141,1)_100%)] before:content-[''] before:absolute before:inset-0 before:p-px before:rounded-[36px] before:[background:linear-gradient(180deg,rgba(255,255,255,0.11)_0%,rgba(255,255,255,0.01)_100%)] before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:z-[1] before:pointer-events-none cursor-pointer hover:opacity-90 transition-opacity"
          type="button"
          aria-label="Start using Sairyne"
        >
          <span className="relative w-fit font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] text-center tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] whitespace-nowrap [font-style:var(--body-font-style)]">
            Let&apos;s start
          </span>
        </button>

        <div className="absolute top-[673px] left-[113px] w-[153px] h-5">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={handleCheckboxChange}
              className="sr-only peer"
              aria-label="Don't show this again"
            />
            <div className="w-3.5 h-3.5 rounded-[3px] border border-solid border-[#ffffff4c] peer-checked:bg-[#7322b6] peer-checked:border-[#7322b6] peer-focus:ring-2 peer-focus:ring-[#7322b6] peer-focus:ring-offset-2 peer-focus:ring-offset-[#141414] transition-all relative flex items-center justify-center">
              {dontShowAgain && (
                <svg
                  className="w-2.5 h-2.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <span className="ml-[7px] font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] whitespace-nowrap [font-style:var(--body-font-style)]">
              Don&apos;t show this again
            </span>
          </label>
        </div>
      </main>
    </Window>
  );
};
