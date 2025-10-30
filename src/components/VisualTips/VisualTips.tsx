import React from "react";
import { VisualTips1 } from "../VisualTips1";
import { VisualTips2 } from "../VisualTips2/VisualTips2";

interface VisualTipsProps {
  tipId?: string;
  currentStep?: number;
}

export const VisualTips = ({ tipId, currentStep }: VisualTipsProps): JSX.Element => {
  // currentStep from FunctionalChat corresponds to chatSteps id
  // Step 1 of 7 — Project Setup is at currentStep = 4
  // Step 2 of 7 — Drum Rack is at currentStep = 5
  const rawStep = Number(currentStep);
  const displayStep = rawStep === 4 ? 1 : 2; // Step 1 (id=4) or Step 2 (id=5)
  
  console.log("VisualTips rendered with currentStep:", currentStep, "displayStep:", displayStep);

  return (
    <div className="relative w-[383px] h-[810px] bg-[#141414] rounded-[7px] overflow-hidden">
      {/* Content based on stepNumber */}
      {displayStep === 1 && (
        <VisualTips1 currentStep={currentStep} />
      )}

      {displayStep === 2 && (
        <VisualTips2 currentStep={currentStep} />
      )}
    </div>
  );
};