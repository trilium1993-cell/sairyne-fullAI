import React, { useState, useEffect, useRef } from "react";
import { Frame } from "../Frame";

interface ChatMessage {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: number;
  isTyping?: boolean;
}

interface ChatStep {
  id: number;
  ai: string;
  options?: string[];
  next?: { [key: string]: number };
}

interface InteractiveChatProps {
  onNext: () => void;
  onBack: () => void;
}

export const InteractiveChat = ({ onNext, onBack }: InteractiveChatProps): JSX.Element => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [projectName, setProjectName] = useState("New Project");
  const [userInput, setUserInput] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Полный поток чата из всех Chat1-Chat5
  const chatFlow: ChatStep[] = [
    {
      id: 1,
      ai: "What you'd like to do with New Project? Select your choice or simply type in what you'd like to do.",
      options: ["Create new song from scratch", "Help with current song", "Create remix"],
      next: { 
        "Create new song from scratch": 2, 
        "Help with current song": 2, 
        "Create remix": 2 
      }
    },
    {
      id: 2,
      ai: "Select the genre of the song or type in.",
      options: ["House", "Techno", "Trance", "Drum & Bass"],
      next: { 
        "House": 3, 
        "Techno": 3, 
        "Trance": 3, 
        "Drum & Bass": 3 
      }
    },
    {
      id: 3,
      ai: "Creating the plan for House creation process...",
      next: { "continue": 4 }
    },
    {
      id: 4,
      ai: "Perfect, let's create a track in the House style.\n\nTo make things simple, we'll break the process down into clear steps:\n\nSet up the project (tempo, time signature, basic settings).\nBuild the rhythm (kick, hi-hats, clap).\nCreate the bassline.\nAdd chords and pads.\nLayer melodic elements and leads.\nEnhance with effects and transitions.\nBalance levels and shape the full track structure.\n\n💡 At any point, you can ask questions or request extra guidance — I'll provide more details so you fully understand the process.\n\nAre you ready to start with Step 1 — Project Setup?",
      options: ["I'm ready! Let's start!"],
      next: { "I'm ready! Let's start!": 5 }
    },
    {
      id: 5,
      ai: "🟢 Step 1 of 7 — Project Setup\n\nIn House music, the foundation is usually a tempo of 120–125 BPM and a 4/4 time signature.\n\nWhy?\n\nTempo (124 BPM): This speed feels energetic but still groovy — perfect for dancing.\n\nTime Signature (4/4): Almost every House track uses this because it creates the steady, driving pulse you hear in clubs.\n\nLet's set your project to:\n\nTempo: 124 BPM\nTime Signature: 4/4\n\nOn the right, you'll see a visual guide highlighting where to adjust these settings in Ableton.\n\nWhen you're ready, type \"done\" and we'll move on to Step 2 — Rhythm. 🎵",
      options: ["Show visual tips", "Continue"],
      next: { "Show visual tips": 6, "Continue": 7 }
    },
    {
      id: 6,
      ai: "Here are the visual tips for setting up your project in Ableton Live...",
      next: { "continue": 7 }
    },
    {
      id: 7,
      ai: "✅ Project setup completed. Proceed to next phase."
    }
  ];

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

  // Автоматический скролл вниз
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Инициализация первого сообщения
  useEffect(() => {
    if (messages.length === 0) {
      const firstStep = chatFlow.find(step => step.id === 1);
      if (firstStep) {
        addAIMessage(firstStep.ai);
      }
    }
  }, []);

  // Автоскролл при изменении сообщений
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Добавляем AI сообщение с анимацией печатания
  const addAIMessage = (content: string) => {
    const message: ChatMessage = {
      id: `ai-${Date.now()}`,
      type: 'ai',
      content: '',
      timestamp: Date.now(),
      isTyping: true
    };
    
    setMessages(prev => [...prev, message]);
    setIsTyping(true);
    
    // Анимация печатания
    let currentText = '';
    let index = 0;
    
    const typeNextChar = () => {
      if (index < content.length) {
        currentText += content[index];
        setMessages(prev => prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, content: currentText }
            : msg
        ));
        index++;
        setTimeout(typeNextChar, 30);
      } else {
        setMessages(prev => prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, isTyping: false }
            : msg
        ));
        setIsTyping(false);
      }
    };
    
    setTimeout(typeNextChar, 500);
  };

  // Добавляем пользовательское сообщение
  const addUserMessage = (content: string) => {
    const message: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: Date.now(),
      isTyping: false
    };
    
    setMessages(prev => [...prev, message]);
  };

  // Обработка выбора опции
  const handleOptionClick = (option: string) => {
    // Добавляем выбор пользователя
    addUserMessage(option);
    
    // Получаем текущий шаг
    const currentStepData = chatFlow.find(step => step.id === currentStep);
    if (currentStepData && currentStepData.next) {
      const nextStepId = currentStepData.next[option];
      if (nextStepId) {
        // Переходим к следующему шагу через 1.2 секунды
        setTimeout(() => {
          const nextStep = chatFlow.find(step => step.id === nextStepId);
          if (nextStep) {
            setCurrentStep(nextStepId);
            addAIMessage(nextStep.ai);
          }
        }, 1200);
      }
    }
  };

  // Обработка отправки сообщения
  const handleSendMessage = () => {
    if (userInput.trim()) {
      addUserMessage(userInput);
      setUserInput("");
      
      // Переходим к следующему шагу
      setTimeout(() => {
        const nextStep = chatFlow.find(step => step.id === currentStep + 1);
        if (nextStep) {
          setCurrentStep(currentStep + 1);
          addAIMessage(nextStep.ai);
        }
      }, 1200);
    }
  };

  // Обработка нажатия клавиши
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleAnalyze = () => {
    console.log("Analyze clicked");
  };

  const handleLearn = () => {
    console.log("Learn clicked");
  };

  // Получаем текущий шаг
  const currentStepData = chatFlow.find(step => step.id === currentStep);

  return (
    <div className="relative w-[383px] h-[847px] bg-gradient-to-b from-[#0b0b10] to-[#1a1a22] rounded-[10px] overflow-hidden">
      {/* Header */}
      <header className="absolute top-[calc(50.00%_-_416px)] left-0 right-0 flex items-center justify-between px-3 h-5">
        <h1 className="[font-family:'Inter',Helvetica] font-medium text-white text-[13px] text-center tracking-[0] leading-[normal]">
          Sairyne
        </h1>
      </header>

      <main className="absolute top-[34px] left-[3px] w-[377px] h-[810px] bg-[#141414] rounded-[7px] overflow-hidden">
        {/* Gradient Background */}
        <div
          className="absolute top-[calc(50.00%_-_429px)] left-[calc(50.00%_-_140px)] w-[278px] h-[278px] bg-[#6e24ab5e] rounded-[139px] blur-[122px]"
          aria-hidden="true"
        />

        {/* Project Header */}
        <div className="absolute top-0 left-[3px]">
          <Frame projectName={projectName} />
        </div>

        {/* Chat Messages Container */}
        <div 
          ref={chatContainerRef} 
          className="absolute top-[95px] left-[10px] right-[10px] bottom-[140px] overflow-y-auto scroll-smooth"
          style={{ scrollBehavior: 'smooth' }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex mb-4 transition-all duration-500 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className={`max-w-[347px] rounded-[14px] border border-solid p-4 transition-all duration-300 shadow-lg ${
                message.type === 'user'
                  ? 'bg-[#7e3cff] border-[#7e3cff] text-white'
                  : 'bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] border-[#ffffff0a] text-white'
              }`}>
                {message.type === 'ai' && (
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-[30px] h-[30px] flex-shrink-0 flex bg-[#141414] rounded-[17.75px] overflow-hidden border-[0.78px] border-solid border-[#ffffff1f]">
                      <img
                        className="mt-[3.1px] w-[21.78px] h-[21.78px] ml-[3.1px] aspect-[1]"
                        alt="Sairyne avatar"
                        src="https://c.animaapp.com/hOiZ2IT6/img/b56f1665-0403-49d2-b00e-ec2a27378422-1@2x.png"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)] whitespace-pre-line">
                        {message.content}
                        {message.isTyping && <span className="animate-pulse ml-1">|</span>}
                      </p>
                    </div>
                  </div>
                )}
                
                {message.type === 'user' && (
                  <p className="font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)] whitespace-pre-line">
                    {message.content}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Интерактивные опции */}
          {currentStepData && currentStepData.options && !isTyping && (
            <div className="flex flex-col gap-3 items-end mb-4 transition-all duration-500">
              {currentStepData.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionClick(option)}
                  className="max-w-[347px] rounded-[14px] border border-solid border-[#ffffff21] bg-[#ffffff08] hover:bg-[#ffffff0f] hover:border-[#7e3cff] px-4 py-3 text-right transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <p className="font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)]">
                    {option}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className={`absolute bottom-[10px] left-[10px] w-[357px] h-[116px] bg-[#ffffff0d] rounded-[7px] backdrop-blur-[18.5px] transition-all duration-300 ${
          userInput ? 'ring-2 ring-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : ''
        }`}>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message..."
            className="absolute top-2.5 left-3 w-[calc(100%_-_100px)] font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)] placeholder:text-[#ffffff6b] focus:outline-none bg-transparent"
          />
          
          {userInput ? (
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
