import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessage } from "../ChatMessage";
import { ChatButton } from "../ChatButton";

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: number;
  isTyping?: boolean;
  isThinking?: boolean;
}

export const ChatWindow = (): JSX.Element => {
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

  // Инициализация чата
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      // Начинаем с первого шага
      const step = chatSteps[0];
      const newMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: step.ai,
        timestamp: Date.now(),
        isTyping: true
      };
      
      setMessages([newMessage]);
      setCurrentStep(0);
      
      // Показываем опции после завершения печатания
      setTimeout(() => {
        setShowOptions(true);
        setOptionTexts(step.options);
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, isTyping: false } : msg
        ));
      }, 2000);
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
    if (import.meta.env.DEV) {
      console.debug('[splitChat-window] analyze');
    }
  }, []);

  const handleLearnClick = useCallback(() => {
    if (import.meta.env.DEV) {
      console.debug('[splitChat-window] learn');
    }
  }, []);

  return (
    <div className="w-[500px] h-screen bg-gradient-to-br from-[#0b0b10] to-[#1a1a22] rounded-[10px] border border-white/10 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h1 className="text-white text-lg font-medium">Sairyne</h1>
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm">New Project | Steps 1/7</span>
        </div>
      </div>

      {/* Chat Container */}
      <div 
        ref={chatContainerRef} 
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message.content}
            isTyping={message.isTyping}
            isThinking={message.isThinking}
          />
        ))}

        {/* Опции для выбора */}
        {showOptions && optionTexts.length > 0 && (
          <div className="space-y-2">
            {optionTexts.map((text, index) => (
              <ChatButton
                key={index}
                text={text}
                onClick={() => handleOptionClick(text)}
                variant="secondary"
                className="w-full animate-fadeIn"
              />
            ))}
          </div>
        )}

        {/* Жанры для выбора */}
        {showGenres && genreTexts.length > 0 && (
          <div className="space-y-2">
            {genreTexts.map((text, index) => (
              <ChatButton
                key={index}
                text={text}
                onClick={() => handleOptionClick(text)}
                variant="secondary"
                className="w-full animate-fadeIn"
              />
            ))}
          </div>
        )}

        {/* Кнопка "I'm ready! Let's start!" */}
        {showReadyButton && (
          <div className="flex justify-end">
            <ChatButton
              text="I'm ready! Let's start!"
              onClick={() => {
                setReadyButtonClicked(true);
                setUserInput("I'm ready! Let's start!");
              }}
              variant={readyButtonHighlighted ? "primary" : "secondary"}
              className="w-fit animate-fadeIn"
            />
          </div>
        )}

        {/* Кнопка "Completed. Next step." */}
        {showCompletedStep && (
          <div className="flex justify-end">
            <ChatButton
              text={completedStepText}
              onClick={() => {
                if (import.meta.env.DEV) {
                  console.debug('[splitChat-window] completed step');
                }
              }}
              variant="primary"
              className="w-fit animate-fadeIn"
            />
          </div>
        )}
      </div>

      {/* Поле ввода сообщения */}
      <div className="p-6 border-t border-white/10">
        <div className={`flex gap-3 rounded-lg transition-all duration-300 ${
          userInput ? 'ring-2 ring-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : ''
        }`}>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message..."
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleSendClick}
            className={`px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-300 ${
              userInput ? 'ring-2 ring-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.5)]' : ''
            }`}
          >
            Send
          </button>
        </div>
        
        <div className="flex gap-3 mt-3">
          <button
            onClick={handleAnalyzeClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Analyze
          </button>
          <button
            onClick={handleLearnClick}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Learn
          </button>
        </div>
      </div>
    </div>
  );
};
