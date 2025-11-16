import React, { useState } from "react";

interface VisualTips1Props {
  currentStep?: number;
}

const TipImage = ({ src, alt }: { src: string; alt: string }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-[140px] w-full items-center justify-center rounded-md border border-dashed border-white/20 bg-white/5 px-3 text-center text-xs text-white/70">
        {alt}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="h-auto w-full rounded-md object-cover"
      onError={() => setFailed(true)}
    />
  );
};

const TipCard = (
  {
    step,
    title,
    body,
    imageSrc,
    imageAlt
  }: {
    step: number;
    title: string;
    body: string[];
    imageSrc: string;
    imageAlt: string;
  }
) => (
  <article className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-[13px] font-bold text-white">
        {step}
      </div>
      <h3 className="text-[15px] font-semibold leading-[19px] text-white">{title}</h3>
    </div>
    <TipImage src={imageSrc} alt={imageAlt} />
    {body.map((paragraph, index) => (
      <p key={index} className="text-[13px] font-light leading-relaxed text-white/95">
        {paragraph}
      </p>
    ))}
  </article>
);

export const VisualTips1 = ({ currentStep }: VisualTips1Props): JSX.Element => {
  if (import.meta.env.DEV) {
    console.debug('[visualTips1] render step', currentStep);
  }

  return (
    <div className="flex h-full w-full flex-col gap-5 overflow-y-auto px-6 py-4">
      <TipCard
        step={1}
        title="Change the tempo"
        imageSrc="https://c.animaapp.com/sseO3qZP/img/group-35@2x.png"
        imageAlt="Tempo change screenshot"
        body={[
          "To change the tempo, locate the BPM panel in the top-left corner, just above the search bar.",
          "Click and hold the BPM value (as shown in the screenshot), then drag up or down to increase or decrease the tempo."
        ]}
      />

      <TipCard
        step={2}
        title="Time signature"
        imageSrc="https://c.animaapp.com/sseO3qZP/img/screenshot-2025-09-07-at-14-48-05-1@2x.png"
        imageAlt="Time signature settings"
        body={[
          "The default time signature in a new Ableton project is 4/4, which is standard for House music.",
          "You can leave it as is because most dance music uses 4/4 — it makes building grooves and patterns much easier."
        ]}
      />
    </div>
  );
};