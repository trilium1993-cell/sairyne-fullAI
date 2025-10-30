import React, { useState } from "react";

interface ContentSection {
  id: string;
  content: React.ReactNode;
}

interface Chat5TipsExtensionProps {
  isVisible: boolean;
  onClose?: () => void;
}

export const Chat5TipsExtension = ({ isVisible, onClose }: Chat5TipsExtensionProps): JSX.Element => {
  const [isVisualTipsVisible, setIsVisualTipsVisible] = useState(true);

  const contentSections: ContentSection[] = [
    {
      id: "header",
      content: (
        <header className="absolute top-2.5 left-[47px] w-[300px]">
          <h1 className="[font-family:'DM_Sans',Helvetica] font-bold text-white text-[13px] tracking-[0] leading-[19px]">
            🟢 Step 1 of 7 — Project Setup
          </h1>
        </header>
      ),
    },
    {
      id: "intro",
      content: (
        <section className="absolute top-[53px] left-[47px] w-[297px]">
          <p className="[font-family:'DM_Sans',Helvetica] font-light text-white text-xs tracking-[0] leading-[19px]">
            In House music, the foundation is usually a tempo of 120–125 BPM and
            a 4/4 time signature.
          </p>
        </section>
      ),
    },
    {
      id: "why",
      content: (
        <section className="gap-1.5 w-[297px] h-32 top-[115px] left-[47px] flex flex-col items-start absolute">
          <h2 className="font-normal text-xs leading-[19px] relative self-stretch [font-family:'DM_Sans',Helvetica] text-white tracking-[0]">
            <span className="font-bold">Why?</span>
          </h2>
          <p className="font-normal text-xs leading-[19px] relative self-stretch [font-family:'DM_Sans',Helvetica] text-white tracking-[0]">
            <span className="font-light">
              Tempo (124 BPM): This speed feels energetic but still groovy —
              perfect for dancing.
            </span>
          </p>
          <p className="font-normal text-xs leading-[19px] relative self-stretch [font-family:'DM_Sans',Helvetica] text-white tracking-[0]">
            <span className="font-light">
              Time Signature (4/4): Almost every House track uses this because
              it creates the steady, driving pulse you hear in clubs.
            </span>
          </p>
        </section>
      ),
    },
    {
      id: "settings",
      content: (
        <section className="gap-1.5 w-[297px] h-[71px] top-[266px] left-[47px] flex flex-col items-start absolute">
          <h2 className="font-normal text-xs leading-[19px] relative self-stretch [font-family:'DM_Sans',Helvetica] text-white tracking-[0]">
            <span className="font-bold">Let&apos;s set your project to:</span>
          </h2>
          <p className="font-normal text-xs leading-[19px] relative self-stretch [font-family:'DM_Sans',Helvetica] text-white tracking-[0]">
            <span className="font-light">Tempo: 124 BPM</span>
          </p>
          <p className="font-normal text-xs leading-[19px] relative self-stretch [font-family:'DM_Sans',Helvetica] text-white tracking-[0]">
            <span className="font-light">Time Signature: 4/4</span>
          </p>
        </section>
      ),
    },
    {
      id: "instructions",
      content: (
        <section className="gap-1.5 w-[297px] h-[82px] top-[361px] left-[47px] flex flex-col items-start absolute">
          <p className="font-light text-xs leading-[19px] relative self-stretch [font-family:'DM_Sans',Helvetica] text-white tracking-[0]">
            <span className="[font-family:'DM_Sans',Helvetica] font-light text-white text-xs tracking-[0] leading-[19px]">
              On the right, you&apos;ll see a visual guide highlighting where to
              adjust these settings in Ableton.
            </span>
          </p>
          <p className="font-light text-xs leading-[19px] relative self-stretch [font-family:'DM_Sans',Helvetica] text-white tracking-[0]">
            <span className="[font-family:'DM_Sans',Helvetica] font-light text-white text-xs tracking-[0] leading-[19px]">
              When you&apos;re ready, type &quot;done&quot; and we&apos;ll move
              on to Step 2 — Rhythm. 🎵
            </span>
          </p>
        </section>
      ),
    },
  ];

  const dividerLines = [
    { top: "41px", ariaLabel: "Section divider after header" },
    { top: "104px", ariaLabel: "Section divider after introduction" },
    { top: "255px", ariaLabel: "Section divider after why section" },
    { top: "350px", ariaLabel: "Section divider after settings" },
  ];

  const tempoInstructions = [
    "To change the tempo, locate the BPM panel in the top-left corner, just above the search bar.",
    "Click and hold the BPM value (as shown in the screenshot), then drag up or down to increase or decrease the tempo.",
  ];

  const timeSignatureInstructions = [
    "The default time signature in a new Ableton project is 4/4, which is standard for House music.",
    "You can leave it as is because most dance music uses 4/4 — it makes building grooves and patterns much easier.",
  ];

  if (!isVisible) return null;

  return (
    <div className="absolute top-0 right-0 w-[772px] h-[847px] bg-[#141018] rounded-[7px] overflow-hidden z-40 transform transition-all duration-500 ease-out">
      <div className="absolute top-[34px] left-1.5 w-[760px] h-[810px] bg-[#141018] rounded-[7px] overflow-hidden">
        <div className="top-[55px] bg-[#7221b6] inline-flex items-center justify-center px-3 py-1.5 absolute right-[393px] rounded-[10px] border border-solid border-[#ffffff21]">
          <div className="relative w-fit mt-[-1.00px] [font-family:'DM_Sans',Helvetica] font-normal text-white text-[13px] text-right tracking-[0] leading-[22px] whitespace-nowrap">
            I&apos;m ready! Let&apos;s start!
          </div>
          <div className="absolute top-5 left-[90px] w-[30px] h-[30px] rotate-[-12.42deg]" />
        </div>

        {/* Visual Tips Section */}
        {isVisualTipsVisible && (
          <article className="absolute top-[109px] left-2.5 w-[357px] h-[505px] bg-[#ffffff08] rounded-[10px] border border-solid border-[#ffffff0a]">
            {contentSections.map((section) => (
              <React.Fragment key={section.id}>{section.content}</React.Fragment>
            ))}

            {dividerLines.map((line, index) => (
              <img
                key={index}
                className={`top-[${line.top}] left-[47px] w-[299px] h-px absolute object-cover`}
                alt={line.ariaLabel}
                src="https://c.animaapp.com/1gA5U3FZ/img/line-26.svg"
                role="separator"
              />
            ))}

            <div className="absolute top-1 left-[5px] w-[30px] h-[30px] flex bg-[#141414] rounded-[17.75px] overflow-hidden border-[0.78px] border-solid border-[#ffffff1f]">
              <img
                className="mt-[3.1px] w-[21.78px] h-[21.78px] ml-[3.1px] aspect-[1]"
                alt="Project icon"
                src="https://c.animaapp.com/1gA5U3FZ/img/b56f1665-0403-49d2-b00e-ec2a27378422-1@2x.png"
              />
            </div>

            <button
              className="flex w-[298px] h-7 items-center justify-center px-3 py-1.5 absolute top-[463px] left-[43px] bg-[#ffffff0d] rounded-md border-[0.6px] border-solid border-[#ffffff21] cursor-pointer hover:bg-[#ffffff15] transition-colors"
              onClick={() => setIsVisualTipsVisible(false)}
              aria-label="Hide visual tips panel"
            >
              <span className="relative w-fit mt-[-3.60px] mb-[-2.40px] [font-family:'DM_Sans',Helvetica] font-normal text-white text-xs tracking-[0] leading-[22px] whitespace-nowrap">
                Hide visual tips
              </span>
            </button>
          </article>
        )}

        <img
          className="absolute top-[106px] left-[401px] w-[329px] h-[109px]"
          alt="Group"
          src="https://c.animaapp.com/1gA5U3FZ/img/group-35@2x.png"
        />

        {/* Tempo Control Section */}
        <div className="absolute top-[234px] left-[401px] w-[335px]">
          <section className="gap-3.5 w-full flex flex-col items-start">
            {tempoInstructions.map((instruction, index) => (
              <p
                key={index}
                className="font-light text-[13px] leading-5 relative self-stretch [font-family:'DM_Sans',Helvetica] text-white tracking-[0]"
              >
                {instruction}
              </p>
            ))}
          </section>
        </div>

        <div className="absolute top-[66px] left-[439px] [font-family:'DM_Sans',Helvetica] font-semibold text-white text-[15px] tracking-[0] leading-[19px] whitespace-nowrap">
          Change the tempo
        </div>

        <div className="absolute top-[380px] left-[439px] [font-family:'DM_Sans',Helvetica] font-semibold text-white text-[15px] tracking-[0] leading-[19px] whitespace-nowrap">
          Time signature
        </div>

        <div className="absolute top-[62px] left-[401px] w-7 h-7 flex rounded-[16.62px] border-[0.88px] border-solid border-[#ffffff33]">
          <div className="w-[5px] ml-[11.4px] mt-[5.2px] h-[17px] [font-family:'DM_Sans',Helvetica] font-bold text-white text-[13.1px] text-center tracking-[0] leading-[16.6px] whitespace-nowrap">
            1
          </div>
        </div>

        <div className="absolute top-[376px] left-[401px] w-7 h-7 flex rounded-[16.62px] border-[0.88px] border-solid border-[#ffffff33]">
          <div className="w-2 ml-[10.5px] mt-[5.2px] h-[17px] [font-family:'DM_Sans',Helvetica] font-bold text-white text-[13.1px] text-center tracking-[0] leading-[16.6px] whitespace-nowrap">
            2
          </div>
        </div>

        <img
          className="absolute top-[420px] left-[401px] w-[335px] h-auto object-contain"
          alt="Time signature settings"
          src="https://c.animaapp.com/1gA5U3FZ/img/screenshot-2025-09-07-at-14-48-05-1@2x.png"
        />

        {/* Time Signature Section */}
        <div className="absolute top-[520px] left-[401px] w-[335px]">
          <section className="gap-3.5 w-full flex flex-col items-start">
            {timeSignatureInstructions.map((text, index) => (
              <p
                key={index}
                className="font-light text-[13px] leading-5 relative self-stretch [font-family:'DM_Sans',Helvetica] text-white tracking-[0]"
              >
                {text}
              </p>
            ))}
          </section>
        </div>

        <div className="absolute top-[723px] left-[-393px] w-[1513px] h-[831px] bg-[#6e24ab5e] rounded-[756.5px/415.5px] blur-[122px]" />

        <img
          className="absolute top-[360px] left-[401px] w-[335px] h-px object-cover"
          alt="Line"
          src="https://c.animaapp.com/1gA5U3FZ/img/line-26-1.svg"
        />

        <div className="top-[632px] inline-flex items-center justify-center px-3 py-1.5 absolute right-[393px] rounded-[10px] border border-solid border-[#ffffff21]">
          <div className="relative w-fit mt-[-1.00px] [font-family:'DM_Sans',Helvetica] font-normal text-white text-[13px] text-right tracking-[0] leading-[22px] whitespace-nowrap">
            Completed. Next step.
          </div>
          <div className="absolute top-5 left-[90px] w-[30px] h-[30px] rotate-[-12.42deg]" />
        </div>

        <div className="absolute top-0 left-[377px] w-[383px] h-10 bg-[#14141447] backdrop-blur-xl backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(24px)_brightness(100%)]">
          <div className="absolute top-3 left-[159px] [font-family:'DM_Sans',Helvetica] font-medium text-white text-[13px] tracking-[0] leading-[normal]">
            Visual tips
          </div>
          <img
            className="absolute w-[3.05%] h-[29.17%] top-[35.42%] left-[3.96%]"
            alt="Group"
            src="https://c.animaapp.com/1gA5U3FZ/img/group@2x.png"
          />
          <img
            className="absolute top-[39px] left-[calc(50.00%_-_192px)] w-[383px] h-px object-cover"
            alt="Line"
            src="https://c.animaapp.com/1gA5U3FZ/img/line-21-1.svg"
          />
        </div>

        <img
          className="top-0 left-[calc(50.00%_-_3px)] w-px h-[810px] absolute object-cover"
          alt="Line"
          src="https://c.animaapp.com/1gA5U3FZ/img/line-22.svg"
        />
      </div>
    </div>
  );
};
