
// CSS для fade-in анимации слов
const fadeInStyle = `
  @keyframes fadeInWord {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .fade-in-word {
    animation: fadeInWord 0.25s ease-in forwards;
  }
`;

interface ChatMessageProps {
  message: string;
  isTyping?: boolean;
  isUser?: boolean;
  avatar?: string;
  className?: string;
  isThinking?: boolean;
}

// Добавим стили в head
if (typeof document !== 'undefined' && !document.getElementById('fade-in-styles')) {
  const style = document.createElement('style');
  style.id = 'fade-in-styles';
  style.textContent = fadeInStyle;
  document.head.appendChild(style);
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

  // Функция для разбивки текста на абзацы с горизонтальными линиями и fade-in эффектом на слова
  const renderMessageWithLines = (text: string) => {
    if (isUser) {
      // Для пользовательских сообщений просто возвращаем текст
      return text;
    }

    // Разбиваем текст на абзацы по двойным переносам строк
    const paragraphs = text.split('\n\n');
    
    return paragraphs.map((paragraph, index) => {
      // Разбиваем абзац на слова и применяем fade-in эффект
      const words = paragraph.split(' ');
      const wordsWithFadeIn = words.map((word, wordIndex) => (
        <span key={wordIndex} className="fade-in-word">
          {word}{wordIndex < words.length - 1 ? ' ' : ''}
        </span>
      ));
      
      return (
        <div key={index}>
          <p className="font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)] whitespace-pre-line">
            {wordsWithFadeIn}
          </p>
          {/* Добавляем горизонтальную линию между абзацами, но не после последнего */}
          {index < paragraphs.length - 1 && (
            <div className="my-3">
              <div className="w-full h-px bg-white/10"></div>
            </div>
          )}
        </div>
      );
    });
  };
  
  const fallbackAvatar = "https://c.animaapp.com/hOiZ2IT6/img/b56f1665-0403-49d2-b00e-ec2a27378422-1@2x.png";

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 ${className}`}>
      <div className={`${baseClasses} ${messageClasses}`}>
        <div className="flex gap-2">
          {!isUser && (
            <div className="w-[30px] h-[30px] flex-shrink-0 flex bg-[#141414] rounded-[17.75px] overflow-hidden border-[0.78px] border-solid border-[#ffffff1f]">
              <img
                className="w-full h-full object-cover"
                alt="AI avatar"
                src={avatar ?? fallbackAvatar}
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
