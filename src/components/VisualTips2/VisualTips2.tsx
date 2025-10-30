import React from "react";

interface VisualTips2Props {
  currentStep?: number;
}

export const VisualTips2 = ({ currentStep }: VisualTips2Props): JSX.Element => {
  console.log("VisualTips2 rendered with currentStep:", currentStep);

  return (
    <>
      {/* Horizontal line under Visual Tips header */}
      <div
        className="absolute top-[9px] left-0 w-full h-px bg-[#FFFFFF33] z-[999] pointer-events-none"
        aria-hidden="true"
      />

      <div className="flex flex-col w-full h-full overflow-y-auto px-6 py-4 gap-4">
        {/* Section Title with Number Badge */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-full border border-white/20 text-white font-bold text-[13px]">
            1
          </div>
          <h2 className="text-[15px] font-semibold text-white leading-[19px]">
            Add Drum Rack
          </h2>
        </div>

        {/* Screenshots Row - 2 скриншота */}
        <div className="flex gap-3 mb-4">
          <img
            src="https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-00-15-1@2x.png"
            alt="Drum Rack Categories"
            className="w-[159px] h-[139px] object-cover rounded-md"
          />
          <img
            src="https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-00-45-1@2x.png"
            alt="Drum Rack Selection"
            className="w-[165px] h-[139px] object-cover rounded-md"
          />
        </div>

        {/* Instruction 1 */}
        <p className="text-white/95 text-[13px] leading-relaxed font-light">
          In the Categories panel, select Drums and locate the Drum Rack
          instrument at the top of the list.
        </p>

        {/* Screenshot 3 - один скриншот */}
        <img
          src="https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-07-27-1@2x.png"
          alt="Drum Rack Placement"
          className="w-full max-w-[326px] h-auto object-cover rounded-md"
        />

        {/* Instruction 2 */}
        <p className="text-white/95 text-[13px] leading-relaxed font-light">
          Click and drag the Drum Rack onto your MIDI track in the track list on
          the left.
        </p>

        {/* Screenshot 4 - скриншот */}
        <img
          src="https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-08-42-1@2x.png"
          alt="Drum Rack Device Panel"
          className="w-full max-w-[326px] h-auto object-cover rounded-md"
        />

        {/* Instruction 3 */}
        <p className="text-white/95 text-[13px] leading-relaxed font-light">
          The instrument will appear in the device panel at the bottom for your
          selected track.
        </p>
      </div>
    </>
  );
};
