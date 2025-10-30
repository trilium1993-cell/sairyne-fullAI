import React from "react";
import { VisualTipsOnly } from "../VisualTipsOnly";

export const VisualTipsWindow = (): JSX.Element => {
  return (
    <div className="w-[500px] h-screen bg-gradient-to-br from-[#0b0b10] to-[#1a1a22] rounded-[10px] border border-white/10 shadow-2xl">
      <VisualTipsOnly />
    </div>
  );
};
