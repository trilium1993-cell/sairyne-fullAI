import React from "react";
import { VisualTipsOnly } from "../../components/VisualTipsOnly";

export const VisualTipsScreen = (): JSX.Element => {
  return (
    <div className="min-h-screen bg-[#0b0b10] flex items-center justify-center p-4">
      <VisualTipsOnly />
    </div>
  );
};
