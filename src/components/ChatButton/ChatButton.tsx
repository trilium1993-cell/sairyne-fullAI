import React from "react";

interface ChatButtonProps {
  text: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "option";
  isVisible?: boolean;
  isTyping?: boolean;
  className?: string;
}

export const ChatButton = ({ 
  text, 
  onClick, 
  variant = "primary",
  isVisible = true,
  isTyping = false,
  className = ""
}: ChatButtonProps): JSX.Element => {
  const baseClasses = "px-3 py-1.5 rounded-[10px] border border-solid transition-all duration-300 font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)]";
  
  const variantClasses = {
    primary: "bg-[#7221b6] border-[#7221b6] hover:bg-[#8532cc]",
    secondary: "bg-[#ffffff08] border-[#ffffff21] hover:border-[#7221b6] hover:bg-[#ffffff0f]",
    option: "bg-[#ffffff08] border-[#ffffff21] hover:border-[#7221b6] hover:bg-[#ffffff0f] text-right"
  };
  
  const visibilityClasses = isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2';
  
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${visibilityClasses} ${className}`}
    >
      {text}
      {isTyping && <span className="animate-pulse">|</span>}
    </button>
  );
};
