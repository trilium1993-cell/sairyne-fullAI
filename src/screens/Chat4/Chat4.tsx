import React, { useState, useEffect, useRef } from "react";
import { Frame } from "../../components/Frame";
import { ChatMessage } from "../../components/ChatMessage";
import { ChatButton } from "../../components/ChatButton";

interface Chat4Props {
  onNext: () => void;
  onBack: () => void;
}

export const Chat4 = ({ onNext }: Chat4Props): JSX.Element => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [message, setMessage] = useState("");
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [showReadyButton, setShowReadyButton] = useState(false);
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
    // Сначала проверяем выбранный проект
    const selectedProjectData = localStorage.getItem('sairyne_selected_project');
    if (selectedProjectData) {
      const selectedProject = JSON.parse(selectedProjectData);
      setProjectName(selectedProject.name);
    } else {
      // Если нет выбранного, берем последний созданный
      const savedProjects = JSON.parse(localStorage.getItem('sairyne_projects') || '[]');
      if (savedProjects.length > 0) {
        const lastProject = savedProjects[savedProjects.length - 1];
        setProjectName(lastProject.name);
      }
    }
  }, []);

  const fullText = "Perfect, let's create a track in the House style.";
  const responseFullText = "To make things simple, we'll break the process down into clear steps:\n\nSet up the project (tempo, time signature, basic settings).\nBuild the rhythm (kick, hi-hats, clap).\nCreate the bassline.\nAdd chords and pads.\nLayer melodic elements and leads.\nEnhance with effects and transitions.\nBalance levels and shape the full track structure.\n\n💡 At any point, you can ask questions or request extra guidance — I'll provide more details so you fully understand the process.\n\nAre you ready to start with Step 1 — Project Setup?";

  // Эффект печатания основного текста
  useEffect(() => {
    if (isTyping && displayedText.length < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 30);
      return () => clearTimeout(timer);
    } else if (displayedText.length === fullText.length) {
      setIsTyping(false);
      // Показываем ответ после завершения основного текста
      setTimeout(() => {
        setShowResponse(true);
      }, 300);
    }
  }, [displayedText, isTyping, fullText]);

  // Автоскролл при изменении контента
  useEffect(() => {
    scrollToBottom();
  }, [displayedText, showResponse, responseText, showReadyButton]);

  // Анимация появления ответа
  useEffect(() => {
    if (!showResponse) return;
    
    let charIndex = 0;
    const typeTimer = setInterval(() => {
      if (charIndex < responseFullText.length) {
        setResponseText(responseFullText.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeTimer);
        // Показываем кнопку после завершения
        setTimeout(() => {
          setShowReadyButton(true);
        }, 500);
      }
    }, 20);
    
    return () => clearInterval(typeTimer);
  }, [showResponse, responseFullText]);

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      setMessage("");
      onNext();
    }
  };

  const handleAnalyze = () => {
    console.log("Analyze clicked");
  };

  const handleLearn = () => {
    console.log("Learn clicked");
  };

  const handleReadyClick = () => {
    console.log("Ready button clicked");
    setMessage("I'm ready! Let's start!");
    setShowReadyButton(false);
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };


  return (
    <div
      className="relative w-[383px] h-[847px] bg-[#413f42] rounded-[10px] overflow-hidden"
      data-model-id="337:2223"
    >
      <header className="absolute top-[calc(50.00%_-_416px)] left-0 right-0 flex items-center justify-between px-3 h-5">
        <h1 className="[font-family:'Inter',Helvetica] font-medium text-white text-[13px] text-center tracking-[0] leading-[normal]">
          Sairyne
        </h1>
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
          {/* System message - left aligned */}
          <ChatMessage
            message={displayedText}
            isTyping={isTyping}
            avatar="https://c.animaapp.com/lOBDEfR4/img/b56f1665-0403-49d2-b00e-ec2a27378422-1@2x.png"
          />

          {/* User message - right aligned */}
          <ChatMessage
            message="Create new song from scratch"
            isUser={true}
          />

          {/* System message - left aligned */}
          <ChatMessage
            message="Select the genre of the song or type in."
            avatar="https://c.animaapp.com/lOBDEfR4/img/b56f1665-0403-49d2-b00e-ec2a27378422-1-2@2x.png"
          />

          {/* User message - right aligned */}
          <ChatMessage
            message="House"
            isUser={true}
          />

          {/* AI Response */}
          {showResponse && (
            <ChatMessage
              message={displayedText}
              isTyping={isTyping}
              avatar="https://c.animaapp.com/lOBDEfR4/img/b56f1665-0403-49d2-b00e-ec2a27378422-1-2@2x.png"
            />
          )}

          {/* Ready button */}
          {showReadyButton && (
            <div className="flex justify-end mb-3">
              <ChatButton
                text="I'm ready! Let's start!"
                onClick={handleReadyClick}
                variant="secondary"
              />
            </div>
          )}

        </div>

        {/* Message Input */}
        <div className={`absolute bottom-[10px] left-[10px] w-[357px] h-[116px] bg-[#ffffff0d] rounded-[7px] backdrop-blur-[18.5px] transition-all duration-300 ${
          message ? 'ring-2 ring-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : ''
        }`}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
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
                src="https://c.animaapp.com/lOBDEfR4/img/frame-13-1.svg"
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
              src="https://c.animaapp.com/lOBDEfR4/img/frame-13-1.svg"
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
              src="https://c.animaapp.com/lOBDEfR4/img/waveform-light-1-1.svg"
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
              src="https://c.animaapp.com/lOBDEfR4/img/stack-1-1.svg"
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
              src="https://c.animaapp.com/lOBDEfR4/img/polygon-1-3.svg"
            />
          </button>
        </div>
      </main>
    </div>
  );
};
