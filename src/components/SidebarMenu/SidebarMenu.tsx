import React, { useState } from "react";
import arrowsIcon from "../../assets/img/arrows-in-simple-light-1.svg";
import closeIcon from "../../assets/img/vector.svg";

interface SidebarMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

export const SidebarMenu = ({ isVisible, onClose }: SidebarMenuProps): JSX.Element => {
  console.log("SidebarMenu rendered, isVisible:", isVisible);
  
  const steps = [
    "Set up the project (tempo, time signature, basic settings).",
    "Build the rhythm (kick, hi-hats, clap).",
    "Create the bassline.",
    "Add chords and pads.",
    "Layer melodic elements and leads.",
    "Enhance with effects and transitions.",
    "Balance levels and shape the full track structure.",
  ];

  return (
    <>
      {/* Overlay */}
      {isVisible && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 w-[389px] h-full bg-[#141018] rounded-r-[7px] z-50 transform transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[#ffffff0a]">
          <h1 className="[font-family:'Inter',Helvetica] font-medium text-white text-[13px] text-center tracking-[0] leading-[normal]">
            Sairyne
          </h1>
          
          <div className="flex items-center gap-2">
            <button
              className="w-5 h-5 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
              aria-label="Minimize window"
            >
              <img
                className="w-[18px] h-[18px]"
                alt="Minimize"
                src={arrowsIcon}
              />
            </button>
            <button
              onClick={onClose}
              className="w-5 h-5 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
              aria-label="Close window"
            >
              <img
                className="w-[14px] h-[14px]"
                alt="Close"
                src={closeIcon}
              />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 h-full overflow-y-auto">
          <div className="flex flex-col gap-5">
            {/* Steps list section - правильный текст из Chat5.1 */}
            <div className="h-[505px] relative bg-[#ffffff08] rounded-[10px] border border-solid border-[#ffffff0a]">
              <header className="absolute top-2.5 left-[47px] w-[300px]">
                <h2 className="[font-family:'DM_Sans',Helvetica] font-bold text-white text-[13px] tracking-[0] leading-[19px]">
                  🟢 Step 1 of 7 — Project Setup
                </h2>
              </header>

              <p className="absolute top-[53px] left-[47px] w-[297px] [font-family:'DM_Sans',Helvetica] font-light text-white text-xs tracking-[0] leading-[19px]">
                In House music, the foundation is usually a tempo of 120–125 BPM and a 4/4 time signature.
              </p>

              <section className="h-32 top-[115px] flex flex-col items-start gap-1.5 absolute w-[297px] left-[47px]">
                <p className="relative self-stretch [font-family:'DM_Sans',Helvetica] font-normal text-white leading-[19px] text-xs tracking-[0]">
                  <span className="font-bold">Why?</span>
                </p>
                <p className="relative self-stretch [font-family:'DM_Sans',Helvetica] font-normal text-white leading-[19px] text-xs tracking-[0]">
                  <span className="font-light">Tempo (124 BPM): This speed feels energetic but still groovy — perfect for dancing.</span>
                </p>
                <p className="relative self-stretch [font-family:'DM_Sans',Helvetica] font-normal text-white leading-[19px] text-xs tracking-[0]">
                  <span className="font-light">Time Signature (4/4): Almost every House track uses this because it creates the steady, driving pulse you hear in clubs.</span>
                </p>
              </section>

              <section className="h-[71px] top-[266px] flex flex-col items-start gap-1.5 absolute w-[297px] left-[47px]">
                <p className="relative self-stretch [font-family:'DM_Sans',Helvetica] font-normal text-white leading-[19px] text-xs tracking-[0]">
                  <span className="font-bold">Let's set your project to:</span>
                </p>
                <p className="relative self-stretch [font-family:'DM_Sans',Helvetica] font-normal text-white leading-[19px] text-xs tracking-[0]">
                  <span className="font-light">Tempo: 124 BPM</span>
                </p>
                <p className="relative self-stretch [font-family:'DM_Sans',Helvetica] font-normal text-white leading-[19px] text-xs tracking-[0]">
                  <span className="font-light">Time Signature: 4/4</span>
                </p>
              </section>

              <section className="h-[82px] top-[361px] flex flex-col items-start gap-1.5 absolute w-[297px] left-[47px]">
                <p className="relative self-stretch [font-family:'DM_Sans',Helvetica] font-light text-white leading-[19px] text-xs tracking-[0]">
                  <span className="[font-family:'DM_Sans',Helvetica] font-light text-white text-xs tracking-[0] leading-[19px]">
                    On the right, you'll see a visual guide highlighting where to adjust these settings in Ableton.
                  </span>
                </p>
                <p className="relative self-stretch [font-family:'DM_Sans',Helvetica] font-light text-white leading-[19px] text-xs tracking-[0]">
                  <span className="[font-family:'DM_Sans',Helvetica] font-light text-white text-xs tracking-[0] leading-[19px]">
                    When you're ready, type "done" and we'll move on to Step 2 — Rhythm. 🎵
                  </span>
                </p>
              </section>

              <div className="absolute top-1 left-[5px] w-[30px] h-[30px] flex bg-[#141414] rounded-[17.75px] overflow-hidden border-[0.78px] border-solid border-[#ffffff1f]">
                <img
                  className="mt-[3.1px] w-[21.78px] h-[21.78px] ml-[3.1px] aspect-[1]"
                  alt="AI Avatar"
                  src="https://c.animaapp.com/Pqm9zsUr/img/b56f1665-0403-49d2-b00e-ec2a27378422-1-1@2x.png"
                />
              </div>

              <button
                className="flex w-[298px] h-7 items-center justify-center px-3 py-1.5 absolute top-[463px] left-[43px] bg-[#ffffff0d] rounded-md border-[0.6px] border-solid border-[#ffffff21] cursor-pointer hover:bg-[#ffffff14] transition-colors"
                type="button"
                aria-label="Show visual tips"
              >
                <span className="relative w-fit mt-[-3.60px] mb-[-2.40px] [font-family:'DM_Sans',Helvetica] font-normal text-white text-xs tracking-[0] leading-[22px] whitespace-nowrap">
                  Show visual tips
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
