import React from "react";

export const Step2RightContent = (): JSX.Element => {
  return (
    <article className="relative w-[383px] h-[563px] bg-[#ffffff08] rounded-[10px] border border-solid border-[#ffffff0a] ml-4">
      <header className="absolute top-2.5 left-[20px] w-[300px]">
        <h1 className="[font-family:'DM_Sans-Bold',Helvetica] font-bold text-white text-[13px] tracking-[0] leading-[19px]">
          Visual Tips
        </h1>
      </header>

      {/* Visual Tips content */}
      <section className="absolute top-[53px] left-[20px] w-[343px]">
        <p className="[font-family:'DM_Sans-Light',Helvetica] font-light text-white text-xs tracking-[0] leading-[19px]">
          Here you'll find visual guides and tips to help you with the Drum Rack setup.
        </p>
      </section>

      {/* Visual guide placeholder */}
      <section className="absolute top-[100px] left-[20px] w-[343px] h-[300px] bg-[#ffffff05] rounded-[8px] border border-solid border-[#ffffff0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 bg-white/20 rounded"></div>
          </div>
          <p className="[font-family:'DM_Sans-Light',Helvetica] font-light text-white/60 text-xs">
            Visual Guide
          </p>
          <p className="[font-family:'DM_Sans-Light',Helvetica] font-light text-white/40 text-xs mt-2">
            Drum Rack Setup
          </p>
        </div>
      </section>

      {/* Additional tips */}
      <section className="absolute top-[420px] left-[20px] w-[343px]">
        <p className="[font-family:'DM_Sans-Bold',Helvetica] font-bold text-white text-xs tracking-[0] leading-[19px] mb-2">
          Quick Tips:
        </p>
        <ul className="[font-family:'DM_Sans-Light',Helvetica] font-light text-white/80 text-xs space-y-1">
          <li>• Look for the Instruments section</li>
          <li>• Drag Drum Rack to your track</li>
          <li>• Double-click to open the rack</li>
        </ul>
      </section>

      <button
        className="w-[343px] h-7 items-center justify-center px-3 py-1.5 top-[520px] left-[20px] bg-[#ffffff0d] rounded-md border-[0.6px] border-solid border-[#ffffff21] absolute flex cursor-pointer hover:bg-[#ffffff15] transition-colors"
        type="button"
        aria-label="Hide visual tips"
      >
        <span className="relative w-fit mt-[-3.60px] mb-[-2.40px] [font-family:'DM_Sans-Regular',Helvetica] font-normal text-white text-xs tracking-[0] leading-[22px] whitespace-nowrap">
          Hide visual tips
        </span>
      </button>
    </article>
  );
};
