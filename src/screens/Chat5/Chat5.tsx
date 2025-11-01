import React, { useState, useEffect, useRef } from "react";
import { Frame } from "../../components/Frame";
import { ChatMessage } from "../../components/ChatMessage";
import { ChatButton } from "../../components/ChatButton";
import { useTypingAnimation } from "../../hooks/useTypingAnimation";

interface Chat5Props {
  onNext: () => void;
  onBack: () => void;
}

export const Chat5 = ({ onNext, onBack }: Chat5Props): JSX.Element => {
  const [message, setMessage] = useState("");
  const [projectName, setProjectName] = useState("New Project");
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [stepText, setStepText] = useState("");
  const [isStepTyping, setIsStepTyping] = useState(false);
  const [showStepContent, setShowStepContent] = useState(false);
  const [isLearnDropdownOpen, setIsLearnDropdownOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Автоматический скролл вниз
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Получаем название проекта из localStorage
  useEffect(() => {
    const selectedProjectData = localStorage.getItem('sairyne_selected_project');
    if (selectedProjectData) {
      const selectedProject = JSON.parse(selectedProjectData);
      setProjectName(selectedProject.name);
    } else {
      const savedProjects = JSON.parse(localStorage.getItem('sairyne_projects') || '[]');
      if (savedProjects.length > 0) {
        const lastProject = savedProjects[savedProjects.length - 1];
        setProjectName(lastProject.name);
      }
    }
  }, []);

  const fullText = "Perfect, let's create a track in the House style.\n\nTo make things simple, we'll break the process down into clear steps:\n\nSet up the project (tempo, time signature, basic settings).\nBuild the rhythm (kick, hi-hats, clap).\nCreate the bassline.\nAdd chords and pads.\nLayer melodic elements and leads.\nEnhance with effects and transitions.\nBalance levels and shape the full track structure.\n\n💡 At any point, you can ask questions or request extra guidance — I'll provide more details so you fully understand the process.\n\nAre you ready to start with Step 1 — Project Setup?";
  const stepFullText = "🟢 Step 1 of 7 — Project Setup\n\nIn House music, the foundation is usually a tempo of 120–125 BPM and a 4/4 time signature.\n\nWhy?\n\nTempo (124 BPM): This speed feels energetic but still groovy — perfect for dancing.\n\nTime Signature (4/4): Almost every House track uses this because it creates the steady, driving pulse you hear in clubs.\n\nLet's set your project to:\n\nTempo: 124 BPM\nTime Signature: 4/4\n\nOn the right, you'll see a visual guide highlighting where to adjust these settings in Ableton.\n\nWhen you're ready, type \"done\" and we'll move on to Step 2 — Rhythm. 🎵";

  // Эффект печатания основного текста
  useEffect(() => {
    if (isTyping && displayedText.length < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 30);
      return () => clearTimeout(timer);
    } else if (displayedText.length === fullText.length) {
      setIsTyping(false);
      // Запускаем печатание Step текста через 1 секунду
      setTimeout(() => {
        setIsStepTyping(true);
        setShowStepContent(true);
      }, 1000);
    }
  }, [displayedText, isTyping, fullText]);

  // Эффект печатания Step текста
  useEffect(() => {
    if (isStepTyping && stepText.length < stepFullText.length) {
      const timer = setTimeout(() => {
        setStepText(stepFullText.slice(0, stepText.length + 1));
      }, 30);
      return () => clearTimeout(timer);
    } else if (stepText.length === stepFullText.length) {
      setIsStepTyping(false);
    }
  }, [stepText, isStepTyping, stepFullText]);

  // Автоскролл при изменении контента
  useEffect(() => {
    scrollToBottom();
  }, [displayedText, isTyping, stepText, isStepTyping, showStepContent]);

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      setMessage("");
      onNext();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleAnalyze = () => {
    console.log("Analyze clicked");
  };

  const handleLearn = () => {
    setIsLearnDropdownOpen(!isLearnDropdownOpen);
  };

  const handleReadyClick = () => {
    console.log("Ready button clicked");
    setMessage("I'm ready! Let's start!");
    setTimeout(() => {
      onNext();
    }, 1000);
  };

  const handleShowVisualTips = () => {
    console.log("Show visual tips clicked");
  };


  const actionButtons = [
    {
      id: "analysis",
      icon: "https://c.animaapp.com/bDY1idTn/img/waveform-light-1.svg",
      label: "Analysis",
      hasDropdown: false,
    },
    {
      id: "learn",
      icon: "https://c.animaapp.com/bDY1idTn/img/stack-1.svg",
      label: "Learn",
      hasDropdown: true,
    },
  ];

  return (
    <div
      className="relative w-[383px] h-[847px] bg-[#413f42] rounded-[10px] overflow-hidden"
      data-model-id="337:2297"
    >
      <header className="absolute top-[calc(50.00%_-_416px)] left-0 right-0 flex items-center justify-between px-3 h-5">
        <h1 className="[font-family:'Inter',Helvetica] font-medium text-white text-[13px] text-center tracking-[0] leading-[normal]">
          Sairyne
        </h1>
      </header>

      <img
        className="absolute top-[calc(50.00%_-_418px)] right-[13px] w-4 h-4"
        alt="Close"
        src="https://c.animaapp.com/bDY1idTn/img/close-1.svg"
      />

      <img
        className="absolute top-[calc(50.00%_-_418px)] right-[41px] w-4 h-4"
        alt="Arrows in simple"
        src="https://c.animaapp.com/bDY1idTn/img/arrows-in-simple-light-1.svg"
      />

      <main className="absolute top-[34px] left-[3px] w-[377px] h-[810px] bg-[#141414] rounded-[7px] overflow-hidden">
        {/* Project Header */}
        <div className="absolute top-0 left-[3px]">
          <Frame projectName={projectName} />
        </div>

        {/* Chat Messages Container */}
        <div ref={chatContainerRef} className="absolute top-[95px] left-[10px] right-[10px] bottom-[140px] overflow-y-auto">
          {/* AI Message with typing effect */}
          <ChatMessage
            message={displayedText}
            isTyping={isTyping}
            avatar="https://c.animaapp.com/bDY1idTn/img/b56f1665-0403-49d2-b00e-ec2a27378422-1@2x.png"
          />

          {/* Step Message with typing effect */}
          {showStepContent && (
            <ChatMessage
              message={stepText}
              isTyping={isStepTyping}
              avatar="https://c.animaapp.com/bDY1idTn/img/b56f1665-0403-49d2-b00e-ec2a27378422-1@2x.png"
            />
          )}

          {/* I'm ready button - appears after main text is typed */}
          {!isTyping && displayedText.length === fullText.length && (
            <div className="flex justify-end mb-3">
              <ChatButton
                text="I'm ready! Let's start!"
                onClick={handleReadyClick}
                variant="primary"
              />
            </div>
          )}

          {/* Show visual tips button - appears after step text is typed */}
          {!isStepTyping && stepText.length === stepFullText.length && (
            <div className="flex justify-start mb-3">
              <ChatButton
                text="Show visual tips"
                onClick={handleShowVisualTips}
                variant="secondary"
                className="w-[298px]"
              />
            </div>
          )}
        </div>

        <div className="absolute top-[734px] left-[-52px] w-[480px] h-[480px] bg-[#6e24ab5e] rounded-[240px] blur-[122px]" />

        {/* Fixed position for "Completed. Next step." */}
        <div className="absolute top-[580px] right-2.5 inline-flex items-center justify-center px-3 py-1.5 rounded-[10px] border border-solid border-[#ffffff21] z-10">
          <div className="relative w-fit mt-[-1.00px] [font-family:'DM_Sans',Helvetica] font-normal text-white text-[13px] text-right tracking-[0] leading-[22px] whitespace-nowrap">
            Completed. Next step.
          </div>
        </div>

        {/* Message Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className={`absolute left-[calc(50.00%_-_178px)] bottom-2.5 w-[357px] h-[116px] bg-[#ffffff0d] rounded-[7px] border-[none] backdrop-blur-[18.5px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(18.5px)_brightness(100%)] before:content-[''] before:absolute before:inset-0 before:p-px before:rounded-[7px] before:[background:linear-gradient(180deg,rgba(255,255,255,0.11)_0%,rgba(255,255,255,0.01)_100%)] before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:z-[1] before:pointer-events-none transition-all duration-300 ${
            message ? 'ring-2 ring-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : ''
          }`}
          role="search"
          aria-label="Message input form"
        >
          <label htmlFor="message-input" className="sr-only">
            Enter your message
          </label>
          <input
            id="message-input"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message..."
            className="absolute top-2.5 left-3 w-[calc(100%_-_24px)] font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)] placeholder:text-[#ffffff6b] focus:outline-none bg-transparent"
            aria-describedby="message-helper-text"
          />

          <button
            type="submit"
            className={`absolute right-1.5 bottom-1.5 w-7 h-7 flex items-center justify-center rounded-md transition-all duration-300 ease-out focus:outline-none ${
              message 
                ? 'bg-[linear-gradient(134deg,rgba(115,34,182,1)_0%,rgba(83,12,141,1)_100%),linear-gradient(0deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.08)_100%)] shadow-[0_0_12px_rgba(168,85,247,0.5)] hover:shadow-[0_0_16px_rgba(168,85,247,0.7)] hover:brightness-110'
                : 'focus:ring-2 focus:ring-white focus:ring-opacity-50 hover:opacity-80'
            }`}
            style={{
              transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
            aria-label="Send message"
          >
            <img
              className="w-7 h-7"
              alt=""
              src="https://c.animaapp.com/bDY1idTn/img/frame-13.svg"
              style={{
                filter: message ? 'brightness(0) invert(1)' : 'none'
              }}
            />
          </button>

          <div
            className="absolute left-3 bottom-1.5 flex gap-2"
            role="group"
            aria-label="Message actions"
          >
            {actionButtons.map((button) => (
              <React.Fragment key={button.id}>
                {button.hasDropdown ? (
                  <button
                    type="button"
                    onClick={handleLearn}
                    className="inline-flex h-7 items-center justify-center gap-1 pl-[7px] pr-2.5 py-[7px] bg-[#211829] rounded-md border-[0.5px] border-solid border-[#e8ceff21] focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all hover:bg-[#2a1f32]"
                    aria-haspopup="true"
                    aria-expanded={isLearnDropdownOpen}
                    aria-label={`${button.label} menu`}
                  >
                    <img
                      className="relative w-4 h-4 mt-[-1.00px] mb-[-1.00px]"
                      alt=""
                      src={button.icon}
                    />
                    <span className="relative w-fit mt-[-2.50px] mb-[-1.50px] font-helper font-[number:var(--helper-font-weight)] text-white text-[length:var(--helper-font-size)] tracking-[var(--helper-letter-spacing)] leading-[var(--helper-line-height)] whitespace-nowrap [font-style:var(--helper-font-style)]">
                      {button.label}
                    </span>
                    <img
                      className="relative w-[6.93px] h-[4.5px]"
                      alt=""
                      src="https://c.animaapp.com/bDY1idTn/img/polygon-1-1.svg"
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    className="inline-flex h-7 items-center justify-center gap-1 pl-[7px] pr-2.5 py-[7px] bg-[#211829] rounded-md border-[0.5px] border-solid border-[#e8ceff21] focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all hover:bg-[#2a1f32]"
                    aria-label={button.label}
                  >
                    <img
                      className="relative w-4 h-4 mt-[-1.00px] mb-[-1.00px]"
                      alt=""
                      src={button.icon}
                    />
                    <span className="relative w-fit mt-[-2.50px] mb-[-1.50px] font-helper font-[number:var(--helper-font-weight)] text-white text-[length:var(--helper-font-size)] tracking-[var(--helper-letter-spacing)] leading-[var(--helper-line-height)] whitespace-nowrap [font-style:var(--helper-font-style)]">
                      {button.label}
                    </span>
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          <span id="message-helper-text" className="sr-only">
            Enter your message and press enter or click send
          </span>
        </form>
      </main>
    </div>
  );
};