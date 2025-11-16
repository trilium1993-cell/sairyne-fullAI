import React, { useState, useEffect, useRef } from "react";
import { Frame } from "../../components/Frame";
import { ChatMessage } from "../../components/ChatMessage";
import { ChatButton } from "../../components/ChatButton";
import "./chat1.css";
import { getLatestProject, getSelectedProject, setSelectedProject } from "../../services/projects";

interface Chat1Props {
  onNext: () => void;
  onBack: () => void;
}

export const Chat1 = ({ onNext }: Chat1Props): JSX.Element => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [optionTexts, setOptionTexts] = useState<string[]>(["", "", ""]);
  const [projectName, setProjectName] = useState("New Project");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Автоматический скролл вниз
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Получаем название проекта из localStorage
  useEffect(() => {
    const selectedProject = getSelectedProject();
    if (selectedProject) {
      if (import.meta.env.DEV) {
        console.debug('Chat1 - selectedProject:', selectedProject);
      }
      setProjectName(selectedProject.name);
      return;
    }

    const latestProject = getLatestProject();
    if (latestProject) {
      if (import.meta.env.DEV) {
        console.debug('Chat1 - lastProject:', latestProject);
      }
      setSelectedProject(latestProject);
      setProjectName(latestProject.name);
    }
  }, []);

  const fullText = "What you'd like to do with New Project? Select your choice or simply type in what you'd like to do.";
  const options = [
    "Create new song from scratch",
    "Help with current song", 
    "Create remix"
  ];

  // Эффект печатания основного текста
  useEffect(() => {
    if (isTyping && displayedText.length < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 30);
      return () => clearTimeout(timer);
    } else if (displayedText.length === fullText.length) {
      setIsTyping(false);
      // Показываем опции после завершения основного текста
      setTimeout(() => {
        setShowOptions(true);
        scrollToBottom();
      }, 300);
    }
  }, [displayedText, isTyping, fullText]);

  // Автоматический скролл при изменении контента
  useEffect(() => {
    scrollToBottom();
  }, [displayedText, showOptions, optionTexts]);

  // Анимация появления опций
  useEffect(() => {
    if (!showOptions) return;
    
    if (import.meta.env.DEV) {
      console.debug('Chat1 - animation start');
    }
    
    // Плавная анимация - показываем опции поочередно с печатанием текста
    const optionsList = [
      "Create new song from scratch",
      "Help with current song", 
      "Create remix"
    ];
    
    optionsList.forEach((option, index) => {
      // Задержка перед началом каждой опции
      setTimeout(() => {
        let charIndex = 0;
        const typeTimer = setInterval(() => {
          if (charIndex < option.length) {
            setOptionTexts(prev => {
              const newTexts = [...prev];
              newTexts[index] = option.slice(0, charIndex + 1);
              return newTexts;
            });
            charIndex++;
          } else {
            clearInterval(typeTimer);
          }
        }, 25); // Быстрая скорость печатания для плавности
      }, index * 200); // Небольшая задержка между опциями
    });
    
    // Автоскролл после анимации
    setTimeout(() => {
      scrollToBottom();
    }, optionsList.length * 200 + 1000);
  }, [showOptions]);

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    setMessage(option);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (e.target.value !== selectedOption) {
      setSelectedOption("");
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      if (import.meta.env.DEV) {
        console.debug('Chat1 - send', message);
      }
      // Очищаем поле ввода
      setMessage("");
      setSelectedOption("");
      // После отправки сообщения переходим к следующему экрану
      onNext();
    }
  };

  const handleAnalyze = () => {
    if (import.meta.env.DEV) {
      console.debug('Chat1 - analyze clicked');
    }
    // Заглушка для будущего функционала
  };

  const handleLearn = () => {
    if (import.meta.env.DEV) {
      console.debug('Chat1 - learn clicked');
    }
    // Заглушка для будущего функционала
  };


  return (
    <div
      className="relative w-[383px] h-[847px] bg-[#413f42] rounded-[10px] overflow-hidden"
      data-model-id="337:2093"
    >
      <header className="absolute top-[calc(50.00%_-_416px)] left-0 right-0 h-[10px] bg-[#14141447]">
      </header>

      <main className="absolute top-[34px] left-[3px] w-[377px] h-[810px] bg-[#141414] rounded-[7px] overflow-hidden">
        <div
          className="absolute top-[calc(50.00%_-_429px)] left-[calc(50.00%_-_140px)] w-[278px] h-[278px] bg-[#6e24ab5e] rounded-[139px] blur-[122px]"
          aria-hidden="true"
        />

        {/* Project Header */}
        <div className="absolute top-0 left-[3px]">
          <Frame projectName={projectName} />
        </div>

        {/* Chat Messages Container */}
        <div ref={chatContainerRef} className="absolute top-[95px] left-[10px] right-[10px] bottom-[140px] overflow-y-auto">
          {/* Аватар и сообщение с эффектом печатания */}
          <ChatMessage
            message={displayedText}
            isTyping={isTyping}
            avatar="https://c.animaapp.com/hOiZ2IT6/img/b56f1665-0403-49d2-b00e-ec2a27378422-1@2x.png"
          />

          {/* Опции выбора */}
          {showOptions && (
            <div className="flex flex-col gap-3 items-end mb-3">
              {options.map((option, index) => {
                const hasText = optionTexts[index] && optionTexts[index].length > 0;
                const isTyping = hasText && optionTexts[index].length < option.length;
                const shouldShow = hasText || index === 0; // Показываем первую опцию сразу, остальные по мере появления текста
                
                return (
                  <ChatButton
                    key={index}
                    text={hasText ? optionTexts[index] : ''}
                    onClick={() => handleOptionClick(option)}
                    variant="option"
                    isVisible={shouldShow}
                    isTyping={!!isTyping}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Поле ввода сообщения */}
        <div className={`absolute bottom-[10px] left-[10px] w-[357px] h-[116px] bg-[#ffffff0d] rounded-[7px] backdrop-blur-[18.5px] transition-all duration-300 ${
          message ? 'ring-2 ring-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : ''
        }`}>
          <input
            type="text"
            value={message}
            onChange={handleMessageChange}
            placeholder="Message..."
            className="absolute top-[10px] left-[12px] text-white bg-transparent border-none outline-none placeholder:text-[#ffffff6b]"
            style={{ 
              width: 'calc(100% - 100px)',
              fontFamily: 'var(--body-font-family)',
              fontSize: 'var(--body-font-size)',
              fontStyle: 'var(--body-font-style)',
              fontWeight: 'var(--body-font-weight)',
              letterSpacing: 'var(--body-letter-spacing)',
              lineHeight: 'var(--body-line-height)'
            }}
          />

          {message ? (
            <button
              className="absolute bottom-[6px] right-[6px] w-[28px] h-[28px] flex items-center justify-center rounded-md cursor-pointer transition-all duration-300 ease-out bg-[linear-gradient(134deg,rgba(115,34,182,1)_0%,rgba(83,12,141,1)_100%),linear-gradient(0deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.08)_100%)] shadow-[0_0_12px_rgba(168,85,247,0.5)] hover:shadow-[0_0_16px_rgba(168,85,247,0.7)] hover:brightness-110"
              style={{
                transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}
              type="button"
              aria-label="Send message"
              onClick={handleSendMessage}
            >
              <img
                className="w-[28px] h-[28px]"
                alt="Send"
                src="https://c.animaapp.com/hOiZ2IT6/img/frame-13-1.svg"
                style={{
                  filter: 'brightness(0) invert(1)'
                }}
              />
            </button>
          ) : (
            <img
              className="absolute bottom-[6px] right-[6px] w-[28px] h-[28px] cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:opacity-80"
              style={{
                transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}
              alt="Send"
              src="https://c.animaapp.com/hOiZ2IT6/img/frame-13-1.svg"
              onClick={handleSendMessage}
            />
          )}

          <button
            onClick={handleAnalyze}
            className="absolute bottom-[6px] right-[268px] flex items-center gap-1 bg-[#211829] border border-solid border-[#e8ceff21] rounded-[6px] px-[7px] py-[7px] cursor-pointer"
          >
            <img
              className="w-4 h-4"
              alt="Analysis"
              src="https://c.animaapp.com/hOiZ2IT6/img/waveform-light-1-1.svg"
            />
            <span className="text-white" style={{
              fontFamily: 'var(--helper-font-family)',
              fontSize: 'var(--helper-font-size)',
              fontStyle: 'var(--helper-font-style)',
              fontWeight: 'var(--helper-font-weight)',
              letterSpacing: 'var(--helper-letter-spacing)',
              lineHeight: 'var(--helper-line-height)'
            }}>Analysis</span>
          </button>

          <button
            onClick={handleLearn}
            className="absolute bottom-[6px] left-[93px] flex items-center gap-1 bg-[#211829] border border-solid border-[#e8ceff21] rounded-[6px] px-[7px] py-[7px] cursor-pointer"
          >
            <img
              className="w-4 h-4"
              alt="Learn"
              src="https://c.animaapp.com/hOiZ2IT6/img/stack-1-1.svg"
            />
            <span className="text-white" style={{
              fontFamily: 'var(--helper-font-family)',
              fontSize: 'var(--helper-font-size)',
              fontStyle: 'var(--helper-font-style)',
              fontWeight: 'var(--helper-font-weight)',
              letterSpacing: 'var(--helper-letter-spacing)',
              lineHeight: 'var(--helper-line-height)'
            }}>Learn</span>
            <img
              className="w-[6.93px] h-[4.5px]"
              alt="Polygon"
              src="https://c.animaapp.com/hOiZ2IT6/img/polygon-1-2.svg"
            />
          </button>
        </div>
      </main>
    </div>
  );
};
