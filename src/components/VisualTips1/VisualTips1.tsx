interface VisualTips1Props {
  currentStep?: number;
}

export const VisualTips1 = ({ currentStep }: VisualTips1Props): JSX.Element => {
  // This component is only called when displayStep === 1, so always show content
  console.log("VisualTips1 rendered with currentStep:", currentStep);

  return (
    <div className="relative w-full h-full">
      {/* Horizontal line under existing header (inside panel) */}
      <div
        className="absolute top-[9px] left-0 w-full h-px bg-[#FFFFFF33] z-[999] pointer-events-none"
        aria-hidden="true"
      />

      {/* RIGHT SIDE WINDOW from localhost:5174 - adjusted positioning */}
      <img
        className="absolute top-[69px] left-[30px] w-[329px] h-[109px]"
        alt="Group"
        src="https://c.animaapp.com/sseO3qZP/img/group-35@2x.png"
      />

      <div className="absolute top-[29px] left-[68px] [font-family:'DM_Sans',Helvetica] font-semibold text-white text-[15px] tracking-[0] leading-[19px] whitespace-nowrap">
        Change the tempo
      </div>

      <div className="absolute top-[356px] left-[68px] [font-family:'DM_Sans',Helvetica] font-semibold text-white text-[15px] tracking-[0] leading-[19px] whitespace-nowrap">
        Time signature
      </div>

      <div className="absolute top-[25px] left-[30px] w-7 h-7 flex rounded-[16.62px] border-[0.88px] border-solid border-[#ffffff33]">
        <div className="w-[5px] ml-[11.4px] mt-[5.2px] h-[17px] [font-family:'DM_Sans',Helvetica] font-bold text-white text-[13.1px] text-center tracking-[0] leading-[16.6px] whitespace-nowrap">
          1
        </div>
      </div>

      <div className="absolute top-[352px] left-[30px] w-7 h-7 flex rounded-[16.62px] border-[0.88px] border-solid border-[#ffffff33]">
        <div className="w-2 ml-[10.5px] mt-[5.2px] h-[17px] [font-family:'DM_Sans',Helvetica] font-bold text-white text-[13.1px] text-center tracking-[0] leading-[16.6px] whitespace-nowrap">
          2
        </div>
      </div>

      <img
        className="absolute top-[397px] left-[30px] w-[335px] h-[67px] object-cover"
        alt="Time signature settings"
        src="https://c.animaapp.com/sseO3qZP/img/screenshot-2025-09-07-at-14-48-05-1@2x.png"
      />

      <img
        className="absolute top-[331px] left-[30px] w-[335px] h-px object-cover"
        alt="Line"
        src="https://c.animaapp.com/sseO3qZP/img/line-26-1.svg"
      />

      {/* Instructions from TempoControlSection */}
      <section className="gap-3.5 w-[335px] h-[114px] top-[197px] left-[30px] flex flex-col items-start absolute">
        <p className="font-light text-[13px] leading-5 relative self-stretch [font-family:'DM_Sans',Helvetica] text-white tracking-[0]">
          To change the tempo, locate the BPM panel in the top-left corner, just above the search bar.
        </p>
        <p className="font-light text-[13px] leading-5 relative self-stretch [font-family:'DM_Sans',Helvetica] text-white tracking-[0]">
          Click and hold the BPM value (as shown in the screenshot), then drag up or down to increase or decrease the tempo.
        </p>
      </section>

      {/* Instructions from TimeSignatureSection */}
      <section className="gap-3.5 w-[335px] h-[114px] top-[484px] left-[30px] flex flex-col items-start absolute">
        <p className="font-light text-[13px] leading-5 relative self-stretch [font-family:'DM_Sans',Helvetica] text-white tracking-[0]">
          The default time signature in a new Ableton project is 4/4, which is standard for House music.
        </p>
        <p className="font-light text-[13px] leading-5 relative self-stretch [font-family:'DM_Sans',Helvetica] text-white tracking-[0]">
          You can leave it as is because most dance music uses 4/4 — it makes building grooves and patterns much easier.
        </p>
      </section>
    </div>
  );
};