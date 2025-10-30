import React from "react";
import "./VisualTipsWindowNew.css";
import arrowsIcon from "../../assets/img/arrows-in-simple-light-1.svg";
import closeIcon from "../../assets/img/vector.svg";

export const VisualTipsWindowNew = (): JSX.Element => {
  return (
    <div className="visual-tips-window-new">
      {/* Разделительная полоса слева - используем структуру из основного проекта */}
      <div className="absolute top-0 left-0 w-px h-full bg-[#ffffff21]"></div>
      
      {/* Header */}
      <div className="text-wrapper-6">Sairyne</div>
      
      {/* Main Container */}
      <div className="frame-3">
        {/* Visual Tips Header */}
        <div className="frame-8">
          <div className="text-wrapper-17">Visual tips</div>
          <img
            className="group"
            alt="Group"
            src="https://c.animaapp.com/S4VxTiAY/img/group@2x.png"
          />
          <img
            className="line-7"
            alt="Line"
            src="https://c.animaapp.com/S4VxTiAY/img/line-21-2.svg"
          />
        </div>

        {/* Content with proper spacing */}
        <div className="px-5 pt-4 pb-5 space-y-8">
          {/* Section 1: Change the tempo */}
          <section>
            <h2 className="[font-family:'DM_Sans',Helvetica] font-semibold text-white text-[15px] tracking-[0] leading-[19px] mb-3">
              1 Change the tempo
            </h2>
            
            {/* Tempo Controls */}
            <div className="flex items-center gap-2 mb-4">
              <button className="w-8 h-8 bg-[#1d1d1d] rounded-[8px] border border-[#ffffff21] flex items-center justify-center shadow-sm">
                <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>
              </button>
              <button className="px-3 py-1.5 bg-[#ffffff0d] rounded-[8px] border border-[#ffffff21] text-white text-[11px] leading-[14px]">
                Link
              </button>
              <button className="px-3 py-1.5 bg-[#ffffff0d] rounded-[8px] border border-[#ffffff21] text-white text-[11px] leading-[14px]">
                Tap
              </button>
              <div className="bg-white rounded-[7px] px-3 py-1.5 shadow-sm border border-[#00000014]">
                <span className="text-black font-mono text-[13px] leading-[16px]">120.00</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="w-1 h-2 bg-white/90 rounded"></div>
                <div className="w-1 h-2 bg-white/90 rounded"></div>
              </div>
            </div>

            {/* Search field */}
            <div className="mb-6">
              <div className="w-full px-3 py-2 bg-[#ffffff0d] rounded-[8px] border border-[#ffffff21] text-white text-[11px] leading-[14px]">
                Search (Cmd + F)
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2 text-[12px] text-white/95 leading-[18px]">
              <p>To change the tempo, locate the BPM panel in the top-left corner, just above the search bar.</p>
              <p>Click and hold the BPM value (as shown in the screenshot), then drag up or down to increase or decrease the tempo.</p>
            </div>
          </section>

          {/* Divider line */}
          <img
            className="w-[299px] h-px object-cover opacity-60"
            alt="Section divider"
            src="https://c.animaapp.com/sseO3qZP/img/line-26.svg"
            role="separator"
          />

          {/* Section 2: Time signature */}
          <section>
            <h2 className="[font-family:'DM_Sans',Helvetica] font-semibold text-white text-[15px] tracking-[0] leading-[19px] mb-3">
              2 Time signature
            </h2>
            
            {/* Time signature controls */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                <div className="w-8 h-6 bg-[#1d1d1d] rounded-[8px] border border-[#ffffff21] flex items-center justify-center">
                  <span className="text-white text-[11px] font-mono">4</span>
                </div>
                <div className="w-8 h-6 bg-[#1d1d1d] rounded-[8px] border border-[#ffffff21] flex items-center justify-center">
                  <span className="text-white text-[11px] font-mono">4</span>
                </div>
              </div>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-white/90 rounded-full"></div>
                <div className="w-1 h-1 bg-white/90 rounded-full"></div>
              </div>
              <div className="w-5 h-5 bg-[#1d1d1d] rounded-[6px] border border-[#ffffff21] flex items-center justify-center">
                <div className="w-0 h-0 border-t-[3px] border-t-white border-l-[2px] border-l-transparent border-r-[2px] border-r-transparent"></div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2 text-[12px] text-white/95 leading-[18px]">
              <p>The default time signature in a new Ableton project is 4/4, which is standard for House music.</p>
              <p>You can leave it as is because most dance music uses 4/4 — it makes building grooves and patterns much easier.</p>
            </div>
          </section>
        </div>

        {/* Screenshots (kept for reference, can be removed later if not needed) */}

        {/* Frame Components */}
        <div className="frame-instance">
          <img
            className="stack"
            alt="Stack"
            src="https://c.animaapp.com/S4VxTiAY/img/stack-1-1.svg"
          />
          <img
            className="waveform-light"
            alt="Waveform Light"
            src="https://c.animaapp.com/S4VxTiAY/img/waveform-light-1-1.svg"
          />
        </div>

        <div className="frame-16716">
          <img
            className="frame"
            alt="Frame"
            src="https://c.animaapp.com/S4VxTiAY/img/frame-16715-1.svg"
          />
        </div>

        {/* Blur Effect */}
        <div className="ellipse" />
      </div>

      {/* Close and Minimize buttons */}
      <img
        className="arrows-in-simple w-[18px] h-[18px]"
        alt="Minimize"
        src={arrowsIcon}
      />
      <img
        className="close w-[14px] h-[14px]"
        alt="Close"
        src={closeIcon}
      />
    </div>
  );
};
