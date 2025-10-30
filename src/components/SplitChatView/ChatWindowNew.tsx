import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessage } from "../ChatMessage";
import { ChatButton } from "../ChatButton";
import "./ChatWindowNew.css";
import arrowsIcon from "../../assets/img/arrows-in-simple-light-1.svg";
import closeIcon from "../../assets/img/vector.svg";

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: number;
  isTyping?: boolean;
  isThinking?: boolean;
}

export const ChatWindowNew = (): JSX.Element => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [showGenres, setShowGenres] = useState(false);
  const [showReadyButton, setShowReadyButton] = useState(false);
  const [showStepContent, setShowStepContent] = useState(false);
  const [showCompletedStep, setShowCompletedStep] = useState(false);
  const [optionTexts, setOptionTexts] = useState<string[]>([]);
  const [genreTexts, setGenreTexts] = useState<string[]>([]);
  const [readyButtonHighlighted, setReadyButtonHighlighted] = useState(false);
  const [completedStepText, setCompletedStepText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [readyButtonClicked, setReadyButtonClicked] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  // Полная последовательность чата из Chat1-Chat5
  const chatSteps = [
    {
      id: 0,
      ai: "What you'd like to do with New Project? Select your choice or simply type in what you'd like to do.",
      options: ["Create new song from scratch", "Help with current song", "Create remix"],
      next: { "Create new song from scratch": 1, "Help with current song": 2, "Create remix": 3 }
    },
    {
      id: 1,
      ai: "Perfect! Let's create a track in the House style. What genre would you like to focus on?",
      options: ["House", "Deep House", "Tech House", "Progressive House"],
      next: { "House": 4, "Deep House": 4, "Tech House": 4, "Progressive House": 4 }
    },
    {
      id: 2,
      ai: "I'll help you improve your current song. What specific aspect would you like to work on?",
      options: ["Mix & Master", "Arrangement", "Sound Design", "Effects"],
      next: { "Mix & Master": 4, "Arrangement": 4, "Sound Design": 4, "Effects": 4 }
    },
    {
      id: 3,
      ai: "Great choice! Let's create an amazing remix. What's the original track's genre?",
      options: ["Pop", "Rock", "Electronic", "Hip-Hop"],
      next: { "Pop": 4, "Rock": 4, "Electronic": 4, "Hip-Hop": 4 }
    },
    {
      id: 4,
      ai: "Creating the plan for House creation process...",
      options: [],
      next: {}
    }
  ];

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  // Инициализация чата - убираем динамические сообщения
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      // Просто инициализируем без динамических сообщений
      setCurrentStep(2);
      setShowStepContent(true);
    }
  }, []);

  // Автоскролл при новых сообщениях
  useEffect(() => {
    scrollToBottom();
  }, [messages, showOptions, showGenres, showReadyButton, showStepContent, showCompletedStep, scrollToBottom]);

  // Анимация появления опций для Chat1 (Step 0)
  useEffect(() => {
    if (!showOptions || currentStep !== 0) return;
    
    const optionsList = [
      "Create new song from scratch",
      "Help with current song", 
      "Create remix"
    ];
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < optionsList.length) {
        setOptionTexts(prev => {
          const newTexts = [...prev];
          newTexts[currentIndex] = optionsList[currentIndex];
          return newTexts;
        });
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [showOptions, currentStep]);

  // Анимация появления жанров для Chat2 (Step 1)
  useEffect(() => {
    if (!showGenres || currentStep !== 1) return;
    
    const genresList = [
      "House",
      "Deep House", 
      "Tech House",
      "Progressive House"
    ];
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < genresList.length) {
        setGenreTexts(prev => {
          const newTexts = [...prev];
          newTexts[currentIndex] = genresList[currentIndex];
          return newTexts;
        });
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [showGenres, currentStep]);

  const handleOptionClick = useCallback((option: string) => {
    // Добавляем сообщение пользователя
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: option,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput(option);
    
    // Скрываем опции
    setShowOptions(false);
    setShowGenres(false);
    setOptionTexts([]);
    setGenreTexts([]);
    
    // Определяем следующий шаг
    const currentStepData = chatSteps[currentStep];
    const nextStepId = currentStepData.next[option as keyof typeof currentStepData.next];
    
    if (nextStepId !== undefined) {
      setTimeout(() => {
        const nextStep = chatSteps[nextStepId];
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: nextStep.ai,
          timestamp: Date.now(),
          isTyping: true
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setCurrentStep(nextStepId);
        
        // Если это шаг 4 (Creating the plan...)
        if (nextStepId === 4) {
          setTimeout(() => {
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessage.id ? { ...msg, isTyping: false } : msg
            ));
            
            // Показываем кнопку "I'm ready! Let's start!"
            setTimeout(() => {
              setShowReadyButton(true);
            }, 1000);
          }, 2000);
        } else {
          // Показываем опции для следующего шага
          setTimeout(() => {
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessage.id ? { ...msg, isTyping: false } : msg
            ));
            
            if (nextStepId === 1) {
              setShowGenres(true);
            } else {
              setShowOptions(true);
              setOptionTexts(nextStep.options);
            }
          }, 2000);
        }
      }, 1000);
    }
  }, [currentStep, chatSteps]);

  const handleSendClick = useCallback(() => {
    if (!userInput.trim()) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userInput,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput("");
  }, [userInput]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendClick();
    }
  }, [handleSendClick]);

  const handleAnalyzeClick = useCallback(() => {
    console.log("Analyze clicked");
  }, []);

  const handleLearnClick = useCallback(() => {
    console.log("Learn clicked");
  }, []);

  return (
    <div className="chat-window-new">
      {/* Header */}
      <div className="text-wrapper-6">Sairyne</div>
      
      {/* Main Chat Container */}
      <div className="frame-3">
        {/* Completed. Next step. Button */}
        {showCompletedStep && (
          <div className="frame-4">
            <div className="text-wrapper-7">{completedStepText}</div>
            <div className="hand-tap-fill" />
          </div>
        )}

        {/* Chat Messages */}
        <div className="frame-6">
          {/* AI Avatar */}
          <div className="bf-d-wrapper">
            <img
              className="bf-d"
              alt="Bf d"
              src="https://c.animaapp.com/S4VxTiAY/img/b56f1665-0403-49d2-b00e-ec2a27378422-1@2x.png"
            />
          </div>

          {/* Step Title */}
          <div className="text-wrapper-12">🟢 Step 2 of 7 — Kick Drum</div>
          
          {/* Step Description */}
          <div className="text-wrapper-13">
            The kick drum is the foundation of any House track - it provides the
            driving force that makes people move on the dancefloor. In House
            music, the kick typically hits on every beat (1-2-3-4), creating
            that signature four-on-the-floor rhythm.
          </div>

          {/* Horizontal Lines */}
          <img
            className="line-4"
            alt="Line"
            src="https://c.animaapp.com/S4VxTiAY/img/line-26.svg"
          />
          <img
            className="line-5"
            alt="Line"
            src="https://c.animaapp.com/S4VxTiAY/img/line-26.svg"
          />
          <img
            className="line-6"
            alt="Line"
            src="https://c.animaapp.com/S4VxTiAY/img/line-26.svg"
          />

          {/* Here's our plan section */}
          <div className="flexcontainer-2">
            <p className="span-wrapper">
              <span className="text-wrapper-14">Here's our plan:</span>
            </p>
            <p className="span-wrapper">
              <span className="text-wrapper-15">
                Add Drum Rack - Set up your drum container
              </span>
            </p>
            <p className="span-wrapper">
              <span className="text-wrapper-15">
                Load kick sample - Find the perfect House kick sound
              </span>
            </p>
            <p className="span-wrapper">
              <span className="text-wrapper-15">
                Create MIDI pattern - Program the classic 4/4 rhythm
              </span>
            </p>
          </div>

          {/* Instructions */}
          <div className="flexcontainer">
            <p className="text">
              <span className="span">
                Each step builds on the previous one, so we'll take it nice
                and slow. I'll show you exactly where to click and what to
                drag.
              </span>
            </p>
            <p className="text">
              <span className="span">
                Let's start by adding the Drum Rack instrument! Check out
                the visual guide on the right to see exactly how to do it. →
              </span>
            </p>
            <p className="text">
              <span className="span">
                Once you've added the Drum Rack, let me know and we'll
                move on to finding the perfect kick sample!
              </span>
            </p>
          </div>

          {/* Hide visual tips button */}
          <div className="frame-7">
            <div className="text-wrapper-16">Hide visual tips</div>
          </div>
        </div>

        {/* Убираем динамические сообщения чата - они не нужны для статического рендера */}

        {/* Input Field - используем структуру из основного проекта */}
        <div className="absolute bottom-[10px] left-[10px] h-[116px] bg-[#ffffff0d] rounded-[7px] backdrop-blur-[18.5px] w-[357px]">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message..."
            className="absolute top-[10px] left-[12px] text-[#ffffff6b] bg-transparent border-none outline-none placeholder:text-[#ffffff6b]"
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

          <img
            className="absolute bottom-[6px] right-[6px] w-[28px] h-[28px] cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:opacity-80"
            style={{
              transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
            alt="Send"
            src="https://c.animaapp.com/hOiZ2IT6/img/frame-13-1.svg"
            onClick={handleSendClick}
          />

          <button
            onClick={handleAnalyzeClick}
            className="absolute bottom-[6px] right-[268px] flex items-center gap-1 bg-[#211829] border border-solid border-[#e8ceff21] rounded-[6px] px-[7px] py-[7px] cursor-pointer transition-all duration-300 ease-out hover:bg-[#2a1f35] hover:border-[#e8ceff40]"
            style={{
              transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
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
            onClick={handleLearnClick}
            className="absolute bottom-[6px] left-[93px] flex items-center gap-1 bg-[#211829] border border-solid border-[#e8ceff21] rounded-[6px] px-[7px] py-[7px] cursor-pointer transition-all duration-300 ease-out hover:bg-[#2a1f35] hover:border-[#e8ceff40]"
            style={{
              transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
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
      </div>

      {/* Close and Minimize buttons */}
      <img
        className="arrows-in-simple w-[18px] h-[18px]"
        alt="Minimize"
        src={arrowsIcon}
      />
      <img
        className="close w-[14px] h-[14px]"
        alt="Close"
        src={closeIcon}
      />
    </div>
  );
};
