import "./style.css";

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

export const ChatVisualTips2 = ({ currentStep }: ChatVisualTips2Props): JSX.Element => {
  console.log("ChatVisualTips2 render:", { currentStep });

  // Get the appropriate tip data based on currentStep
  const stepNumber = Number(currentStep) || 1;
  const tip = visualTipsData.find(t => t.stepNumber === stepNumber) || visualTipsData[0];
  
  console.log("ChatVisualTips2 debug:", {
    stepNumber,
    tipFound: tip,
    tipTitle: tip?.title,
    tipStepNumber: tip?.stepNumber
  });
  return (
    <div className="visual-tips-window-new">
      <div className="frame-3">
        {/* Header */}
        <div className="frame-8">
          <div className="text-wrapper-17"></div>
          <div className="group">
            <img
              className="w-3 h-3"
              alt="Group"
              src="https://c.animaapp.com/S4VxTiAY/img/group@2x.png"
            />
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
          <img
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