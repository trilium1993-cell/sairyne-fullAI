import "./style.css";
import { useState } from "react";

interface ChatVisualTips2Props {
  currentStep?: number;
}

// Visual tip data structure
interface VisualTip {
  id: string;
  title: string;
  stepNumber: number;
  instructions: string[];
  screenshots: {
    className: string;
    alt: string;
    src: string;
  }[];
}

const visualTipsData: VisualTip[] = [
  {
    id: "drum-rack-1",
    title: "",
    stepNumber: 1,
    instructions: [
      "",
      "",
      ""
    ],
    screenshots: [
      {
        className: "screenshot",
        alt: "Screenshot",
        src: "https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-00-15-1@2x.png"
      },
      {
        className: "screenshot-2",
        alt: "Screenshot",
        src: "https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-00-45-1@2x.png"
      },
      {
        className: "screenshot-3",
        alt: "Screenshot",
        src: "https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-07-27-1@2x.png"
      },
      {
        className: "screenshot-4",
        alt: "Screenshot",
        src: "https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-08-42-1@2x.png"
      }
    ]
  },
  {
    id: "kick-drum-2",
    title: "",
    stepNumber: 2,
    instructions: [
      "",
      "",
      ""
    ],
    screenshots: [
      {
        className: "screenshot",
        alt: "Screenshot",
        src: "https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-00-45-1@2x.png"
      },
      {
        className: "screenshot-2",
        alt: "Screenshot",
        src: "https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-01-15-1@2x.png"
      },
      {
        className: "screenshot-3",
        alt: "Screenshot",
        src: "https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-07-27-1@2x.png"
      },
      {
        className: "screenshot-4",
        alt: "Screenshot",
        src: "https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-08-42-1@2x.png"
      }
    ]
  },
  {
    id: "midi-pattern-3",
    title: "",
    stepNumber: 3,
    instructions: [
      "",
      "",
      ""
    ],
    screenshots: [
      {
        className: "screenshot",
        alt: "Screenshot",
        src: "https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-07-27-1@2x.png"
      },
      {
        className: "screenshot-2",
        alt: "Screenshot",
        src: "https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-08-42-1@2x.png"
      },
      {
        className: "screenshot-3",
        alt: "Screenshot",
        src: "https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-00-15-1@2x.png"
      },
      {
        className: "screenshot-4",
        alt: "Screenshot",
        src: "https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-00-45-1@2x.png"
      }
    ]
  },
  {
    id: "project-analysis-4",
    title: "",
    stepNumber: 4,
    instructions: [
      "",
      "",
      ""
    ],
    screenshots: [
      {
        className: "screenshot",
        alt: "Screenshot",
        src: "https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-08-42-1@2x.png"
      },
      {
        className: "screenshot-2",
        alt: "Screenshot",
        src: "https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-00-15-1@2x.png"
      },
      {
        className: "screenshot-3",
        alt: "Screenshot",
        src: "https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-00-45-1@2x.png"
      },
      {
        className: "screenshot-4",
        alt: "Screenshot",
        src: "https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-07-27-1@2x.png"
      }
    ]
  },
  {
    id: "project-setup-5",
    title: "",
    stepNumber: 5,
    instructions: [
      "",
      "",
      ""
    ],
    screenshots: [
      {
        className: "screenshot",
        alt: "Screenshot",
        src: "https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-00-15-1@2x.png"
      },
      {
        className: "screenshot-2",
        alt: "Screenshot",
        src: "https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-00-45-1@2x.png"
      },
      {
        className: "screenshot-3",
        alt: "Screenshot",
        src: "https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-07-27-1@2x.png"
      },
      {
        className: "screenshot-4",
        alt: "Screenshot",
        src: "https://c.animaapp.com/S4VxTiAY/img/screenshot-2025-09-07-at-15-08-42-1@2x.png"
      }
    ]
  }
];

const Screenshot = ({ className, alt, src }: { className: string; alt: string; src: string }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`${className} flex items-center justify-center rounded-md border border-dashed border-white/20 bg-white/5 px-3 text-center text-xs text-white/70`}
      >
        {alt}
      </div>
    );
  }

  return (
    <img
      className={className}
      alt={alt}
      src={src}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};

export const ChatVisualTips2 = ({ currentStep }: ChatVisualTips2Props): JSX.Element => {
  const stepNumber = Number(currentStep) || 1;
  const tip = visualTipsData.find(t => t.stepNumber === stepNumber) || visualTipsData[0];

  if (import.meta.env.DEV) {
    console.debug('[chatVisualTips2] render', { currentStep, stepNumber, tip });
  }
  return (
    <div className="visual-tips-window-new">
      <div className="frame-3">
        {/* Header */}
        <div className="frame-8">
          <div className="text-wrapper-17"></div>
          <div className="group flex h-3 w-3 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[8px] text-white">
            i
          </div>
          <div className="line-7"></div>
        </div>

        {/* Step Title with number in circle */}
        <div className="frame-5">
          <div className="text-wrapper-11"></div>
        </div>
        <div className="text-wrapper-10"></div>

        {/* Screenshots */}
        {tip.screenshots.map((screenshot, index) => (
          <Screenshot
            key={index}
            className={screenshot.className}
            alt={screenshot.alt}
            src={screenshot.src}
          />
        ))}

        {/* Instructions */}
        <div className="p">
          <span className="font-medium"></span> 
        </div>
        <div className="text-wrapper-8">
          <span className="font-medium"></span> 
        </div>
        <div className="text-wrapper-9">
          <span className="font-medium"></span> 
        </div>
      </div>
    </div>
  );
};