import React from "react";

export const VisualTipsOnly = (): JSX.Element => {
  return (
    <div className="relative w-[383px] h-[810px] bg-[#141414] rounded-[7px] overflow-hidden">
      {/* Разделительная полоса слева */}
      <div className="absolute top-0 left-0 w-px h-full bg-[#ffffff21]"></div>
        {/* Gradient Background */}
        <div
          className="absolute top-[calc(50.00%_-_429px)] left-[calc(50.00%_-_140px)] w-[278px] h-[278px] bg-[#6e24ab5e] rounded-[139px] blur-[122px]"
          aria-hidden="true"
        />


        {/* Visual Tips Header */}
        <div className="absolute top-0 left-0 w-full h-10 bg-[#141414]">
          <div className="absolute top-3 left-[50%] transform -translate-x-1/2 [font-family:'DM_Sans',Helvetica] font-medium text-white text-[13px] tracking-[0] leading-[normal]">
            Visual tips
          </div>
          <img
            className="absolute w-[3.05%] h-[29.17%] top-[35.42%] left-[3.96%]"
            alt="Group"
            src="https://c.animaapp.com/1gA5U3FZ/img/group@2x.png"
          />
          <img
            className="absolute top-[39px] left-0 w-full h-px object-cover"
            alt="Line"
            src="https://c.animaapp.com/1gA5U3FZ/img/line-21-1.svg"
          />
        </div>

        {/* Step Number */}
        <div className="absolute top-[62px] left-[20px] w-7 h-7 flex rounded-[16.62px] border-[0.88px] border-solid border-[#ffffff33]">
          <div className="w-[5px] ml-[11.4px] mt-[5.2px] h-[17px] [font-family:'DM_Sans',Helvetica] font-bold text-white text-[13.1px] text-center tracking-[0] leading-[16.6px] whitespace-nowrap">
            1
          </div>
        </div>

        {/* Section Title */}
        <div className="absolute top-[66px] left-[60px] [font-family:'DM_Sans',Helvetica] font-semibold text-white text-[15px] tracking-[0] leading-[19px]">
          Change the tempo
        </div>

        {/* Visual Guide Images */}
        <img
          className="absolute top-[106px] left-[20px] w-[340px] h-[109px] object-contain"
          alt="Group"
          src="https://c.animaapp.com/1gA5U3FZ/img/group-35@2x.png"
        />

        {/* Tempo Control Section */}
        <div className="absolute top-[234px] left-[20px] w-[340px]">
          <section className="gap-3.5 w-full flex flex-col items-start">
            <p className="font-light text-[13px] leading-5 relative self-stretch [font-family:'DM_Sans',Helvetica] text-white tracking-[0]">
              To change the tempo, locate the BPM panel in the top-left corner, just above the search bar.
            </p>
            <p className="font-light text-[13px] leading-5 relative self-stretch [font-family:'DM_Sans',Helvetica] text-white tracking-[0]">
              Click and hold the BPM value (as shown in the screenshot), then drag up or down to increase or decrease the tempo.
            </p>
          </section>
        </div>

        {/* Divider Line */}
        <img
          className="absolute top-[360px] left-[20px] w-[340px] h-px object-cover"
          alt="Line"
          src="https://c.animaapp.com/1gA5U3FZ/img/line-26-1.svg"
        />

        {/* Step Number 2 */}
        <div className="absolute top-[376px] left-[20px] w-7 h-7 flex rounded-[16.62px] border-[0.88px] border-solid border-[#ffffff33]">
          <div className="w-2 ml-[10.5px] mt-[5.2px] h-[17px] [font-family:'DM_Sans',Helvetica] font-bold text-white text-[13.1px] text-center tracking-[0] leading-[16.6px] whitespace-nowrap">
            2
          </div>
        </div>

        {/* Time Signature Section */}
        <div className="absolute top-[380px] left-[60px] [font-family:'DM_Sans',Helvetica] font-semibold text-white text-[15px] tracking-[0] leading-[19px]">
          Time signature
        </div>

        {/* Time Signature Image */}
        <img
          className="absolute top-[420px] left-[20px] w-[340px] h-auto object-contain"
          alt="Time signature settings"
          src="https://c.animaapp.com/1gA5U3FZ/img/screenshot-2025-09-07-at-14-48-05-1@2x.png"
        />

        {/* Time Signature Section */}
        <div className="absolute top-[520px] left-[20px] w-[340px]">
          <section className="gap-3.5 w-full flex flex-col items-start">
            <p className="font-light text-[13px] leading-5 relative self-stretch [font-family:'DM_Sans',Helvetica] text-white tracking-[0]">
              The default time signature in a new Ableton project is 4/4, which is standard for House music.
            </p>
            <p className="font-light text-[13px] leading-5 relative self-stretch [font-family:'DM_Sans',Helvetica] text-white tracking-[0]">
              You can leave it as is because most dance music uses 4/4 — it makes building grooves and patterns much easier.
            </p>
          </section>
        </div>

        {/* Blur Effect */}
        <div className="absolute top-[723px] left-[50%] transform -translate-x-1/2 w-[1513px] h-[831px] bg-[#6e24ab5e] rounded-[756.5px/415.5px] blur-[122px]" />
    </div>
  );
};
