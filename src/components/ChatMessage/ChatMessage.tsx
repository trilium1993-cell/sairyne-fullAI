import React from "react";

interface ChatMessageProps {
  message: string;
  isTyping?: boolean;
  isUser?: boolean;
  avatar?: string;
  className?: string;
  isThinking?: boolean;
}

export const ChatMessage = ({ 
  message, 
  isTyping = false, 
  isUser = false, 
  avatar,
  className = "",
  isThinking = false
}: ChatMessageProps): JSX.Element => {
  const baseClasses = "inline-block rounded-[10px] border border-solid transition-all duration-300";
  
  const systemClasses = isThinking ? "bg-[#ffffff04] border-[#ffffff06] opacity-60 max-w-[347px] p-3" : "bg-[#ffffff08] border-[#ffffff0a] max-w-[347px] p-3";
  const userClasses = "bg-[#7221b6] border-[#7221b6] max-w-[347px] px-3 py-1.5";
  
  const messageClasses = isUser ? userClasses : systemClasses;

  // Функция для разбивки текста на абзацы с горизонтальными линиями
  const renderMessageWithLines = (text: string) => {
    if (isUser) {
      // Для пользовательских сообщений просто возвращаем текст
      return text;
    }

    // Разбиваем текст на абзацы по двойным переносам строк
    const paragraphs = text.split('\n\n');
    
    return paragraphs.map((paragraph, index) => (
      <div key={index}>
        <p className="font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)] whitespace-pre-line">
          {paragraph}
        </p>
        {/* Добавляем горизонтальную линию между абзацами, но не после последнего */}
        {index < paragraphs.length - 1 && (
          <div className="my-3">
            <div className="w-full h-px bg-white/10"></div>
          </div>
        )}
      </div>
    ));
  };
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 ${className}`}>
      <div className={`${baseClasses} ${messageClasses}`}>
        <div className="flex gap-2">
          {!isUser && avatar && (
            <div className="w-[30px] h-[30px] flex-shrink-0 flex bg-[#141414] rounded-[17.75px] overflow-hidden border-[0.78px] border-solid border-[#ffffff1f]">
              <img
                className="mt-[3.1px] w-[21.78px] h-[21.78px] ml-[3.1px] aspect-[1]"
                alt="AI avatar"
                src={avatar}
              />
            </div>
          )}
          
          <div className="flex-1">
            {isUser ? (
              <p className={`font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)] whitespace-pre-line ${className}`}>
                {message}
                {isTyping && <span className="animate-pulse">|</span>}
              </p>
            ) : (
              <div className={className}>
                {renderMessageWithLines(message)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
