import React, { useState } from "react";

interface VisualTips2Props {
  currentStep?: number;
}

const TipImage = ({ src, alt }: { src: string; alt: string }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-[139px] w-full max-w-[326px] items-center justify-center rounded-md border border-dashed border-white/20 bg-white/5 px-3 text-center text-xs text-white/70">
        {alt}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="h-auto w-full max-w-[326px] rounded-md object-cover"
      onError={() => setFailed(true)}
    />
  );
};

export const VisualTips2 = ({ currentStep }: VisualTips2Props): JSX.Element => {
  if (import.meta.env.DEV) {
    console.debug('[visualTips2] render step', currentStep);
  }

  return (
    <>
      <div className="flex h-full w-full flex-col gap-4 overflow-y-auto px-6 py-4">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-[13px] font-bold text-white">
            1
          </div>
          <h2 className="text-[15px] font-semibold leading-[19px] text-white">
            Add Drum Rack
          </h2>
        </div>

        <div className="mb-4 flex gap-3">
          <div className="w-[159px]">
            <TipImage
              src="https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-00-15-1@2x.png"
              alt="Drum Rack categories screenshot"
            />
          </div>
          <div className="w-[165px]">
            <TipImage
              src="https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-00-45-1@2x.png"
              alt="Drum Rack selection screenshot"
            />
          </div>
        </div>

        <p className="text-[13px] font-light leading-relaxed text-white/95">
          1. In the Categories panel, select Drums and locate the Drum Rack instrument at the top of the list.
        </p>

        <TipImage
          src="https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-07-27-1@2x.png"
          alt="Drum Rack placement screenshot"
        />

        <p className="text-[13px] font-light leading-relaxed text-white/95">
          2. Click and drag the Drum Rack onto your MIDI track in the track list on the left.
        </p>

        <TipImage
          src="https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-08-42-1@2x.png"
          alt="Drum Rack device panel screenshot"
        />

        <p className="text-[13px] font-light leading-relaxed text-white/95">
          3. The instrument will appear in the device panel at the bottom for your selected track.
        </p>
      </div>
    </>
  );
};
