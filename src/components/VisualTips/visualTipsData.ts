export interface VisualTip {
  id: string;
  title: string;
  stepNumber: number;
  instructions: string[];
  imageUrl?: string;
  imageAlt?: string;
}

export const visualTipsData: VisualTip[] = [
  {
    id: "drum-rack-1",
    title: "",
    stepNumber: 1,
    instructions: [
      "",
      "",
      ""
    ],
    imageUrl: "/img/photo-2025-10-18-23-33-13-1.png",
    imageAlt: "Drum Rack Setup Screenshot"
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
    imageUrl: "/img/photo-2025-10-18-23-33-13-1.png",
    imageAlt: "Kick Drum Sample Loading Screenshot"
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
    imageUrl: "/img/photo-2025-10-18-23-33-13-1.png",
    imageAlt: "MIDI Pattern Creation Screenshot"
  },
  {
    id: "project-setup-1",
    title: "",
    stepNumber: 1,
    instructions: [
      "",
      "",
      ""
    ],
    imageUrl: "/img/photo-2025-10-18-23-33-13-1.png",
    imageAlt: "Project Setup Screenshot"
  },
  {
    id: "step-4-content",
    title: "",
    stepNumber: 4,
    instructions: [
      "",
      "",
      ""
    ],
    imageUrl: "/img/photo-2025-10-18-23-33-13-1.png",
    imageAlt: "Advanced Setup Screenshot"
  },
  {
    id: "step-5-content",
    title: "",
    stepNumber: 5,
    instructions: [
      "",
      "",
      ""
    ],
    imageUrl: "/img/photo-2025-10-18-23-33-13-1.png",
    imageAlt: "Final Configuration Screenshot"
  }
];

export const getVisualTipById = (id: string): VisualTip | undefined => {
  return visualTipsData.find(tip => tip.id === id);
};

export const getVisualTipByStep = (stepNumber: number): VisualTip | undefined => {
  return visualTipsData.find(tip => tip.stepNumber === stepNumber);
};
