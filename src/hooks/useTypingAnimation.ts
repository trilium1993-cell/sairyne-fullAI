import { useState, useEffect } from "react";

interface UseTypingAnimationProps {
  fullText: string;
  speed?: number;
  onComplete?: () => void;
}

export const useTypingAnimation = ({ 
  fullText, 
  speed = 30, 
  onComplete 
}: UseTypingAnimationProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (isTyping && displayedText.length < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, speed);
      return () => clearTimeout(timer);
    } else if (displayedText.length === fullText.length) {
      setIsTyping(false);
      if (onComplete) {
        setTimeout(onComplete, 300); // Small delay before calling onComplete
      }
    }
  }, [displayedText, isTyping, fullText, speed, onComplete]);

  return { displayedText, isTyping };
};
