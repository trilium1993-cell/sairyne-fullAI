import React from "react";

interface Step2LeftContentProps {
  onNextStep?: () => void;
}

export const Step2LeftContent = ({ onNextStep }: Step2LeftContentProps): JSX.Element => {
  const planSteps = [
    "Add Drum Rack - Set up your drum container",
    "Load kick sample - Find the perfect House kick sound",
    "Create MIDI pattern - Program the classic 4/4 rhythm",
  ];

  const instructionParagraphs = [
    "Each step builds on the previous one, so we'll take it nice and slow. I'll show you exactly where to click and what to drag.",
    "Let's start by adding the Drum Rack instrument! Check out the visual guide on the right to see exactly how to do it. →",
    "Once you've added the Drum Rack, let me know and we'll move on to finding the perfect kick sample!",
  ];

  return (
    <article className="relative w-[357px] h-[563px] bg-[#ffffff08] rounded-[10px] border border-solid border-[#ffffff0a]">
      <header className="absolute top-2.5 left-[47px] w-[300px]">
        <h1 className="[font-family:'DM_Sans-Bold',Helvetica] font-bold text-white text-[13px] tracking-[0] leading-[19px]">
          🟢 Step 2 of 7 — Kick Drum
        </h1>
      </header>

      <section className="absolute top-[53px] left-[47px] w-[297px]">
        <p className="[font-family:'DM_Sans-Light',Helvetica] font-light text-white text-xs tracking-[0] leading-[19px]">
          The kick drum is the foundation of any House track - it provides the
          driving force that makes people move on the dancefloor. In House
          music, the kick typically hits on every beat (1-2-3-4), creating that
          signature four-on-the-floor rhythm.
        </p>
      </section>

      <section className="h-[164px] top-[337px] flex flex-col items-start gap-1.5 absolute w-[297px] left-[47px]">
        {instructionParagraphs.map((paragraph, index) => (
          <p
            key={index}
            className="relative self-stretch [font-family:'DM_Sans-Light',Helvetica] font-light text-white text-xs tracking-[0] leading-[19px]"
          >
            <span className="[font-family:'DM_Sans-Light',Helvetica] font-light text-white text-xs tracking-[0] leading-[19px]">
              {paragraph}
            </span>
          </p>
        ))}
      </section>

      <section className="h-[136px] top-[172px] flex flex-col items-start gap-1.5 absolute w-[297px] left-[47px]">
        <p className="relative self-stretch [font-family:'DM_Sans-Bold',Helvetica] font-normal text-white text-xs tracking-[0] leading-[19px]">
          <span className="font-bold">Here's our plan:</span>
        </p>

        {planSteps.map((step, index) => (
          <p
            key={index}
            className="relative self-stretch [font-family:'DM_Sans-Bold',Helvetica] font-normal text-white text-xs tracking-[0] leading-[19px]"
          >
            <span className="[font-family:'DM_Sans-Regular',Helvetica]">
              {step}
            </span>
          </p>
        ))}
      </section>

      <div className="top-[41px] absolute left-[47px] w-[299px] h-px bg-white/20"></div>
      <div className="top-[324px] absolute left-[47px] w-[299px] h-px bg-white/20"></div>
      <div className="top-[161px] absolute left-[47px] w-[299px] h-px bg-white/20"></div>

      <div className="top-1 left-[5px] w-[30px] h-[30px] bg-[#141414] rounded-[17.75px] overflow-hidden border-[0.78px] border-solid border-[#ffffff1f] absolute flex">
        <div className="mt-[3.1px] w-[21.78px] h-[21.78px] ml-[3.1px] aspect-[1] bg-white/20 rounded-full"></div>
      </div>

      {/* Кнопка для перехода к Step 3 */}
      {onNextStep && (
        <button
          className="w-[298px] h-7 items-center justify-center px-3 py-1.5 top-[480px] left-[43px] bg-[#7e3cff] hover:bg-[#6b2cd9] rounded-md border-[0.6px] border-solid border-[#ffffff21] absolute flex cursor-pointer transition-colors"
          type="button"
          onClick={onNextStep}
          aria-label="Continue to Step 3"
        >
          <span className="relative w-fit mt-[-3.60px] mb-[-2.40px] [font-family:'DM_Sans-Regular',Helvetica] font-normal text-white text-xs tracking-[0] leading-[22px] whitespace-nowrap">
            Continue to Step 3
          </span>
        </button>
      )}
    </article>
  );
};
