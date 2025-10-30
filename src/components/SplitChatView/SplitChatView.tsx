import React from "react";
import { ChatWindowNew } from "./ChatWindowNew";
import { VisualTipsWindowNew } from "./VisualTipsWindowNew";

export const SplitChatView = (): JSX.Element => {
  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0b0b10] to-[#1a1a22] gap-6 p-6">
      {/* Левое окно - Чат */}
      <ChatWindowNew />
      
      {/* Правое окно - Visual Tips */}
      <VisualTipsWindowNew />
    </div>
  );
};
