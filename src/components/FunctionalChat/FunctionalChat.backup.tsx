import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { Frame } from "../Frame";
import { ChatMessage } from "../ChatMessage";
import { ChatButton } from "../ChatButton";
import { SidebarMenu } from "../SidebarMenu";
import { LearnMode } from "../../screens/LearnMode";
import { AnalysisWarning } from "../AnalysisWarning";
import { Step3Content } from "../Step3Content";
import { VisualTips } from "../VisualTips";
import { VisualTipsStep4 } from "../VisualTipsStep4";
import { ProjectAnalysis } from "../ProjectAnalysis";
import { AnalysingChannels } from "../AnalysingChannels";
import arrowsIcon from '../../assets/img/arrows-in-simple-light-1.svg';
import closeIcon from '../../assets/img/vector.svg';

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: number;
  isTyping?: boolean;
  isThinking?: boolean;
}

// Мемоизированный компонент для чата
const ChatContainer = React.memo(({ 
  messages, 
  showOptions, 
  showGenres, 
  showReadyButton, 
  showStepContent: _showStepContent, 
  showCompletedStep,
  currentStep,
  readyButtonHighlighted: _readyButtonHighlighted,
  completedStepText,
  onOptionClick,
  onGenreClick: _onGenreClick,
  onReadyClick: _onReadyClick,
  onVisualTipsToggle: _onVisualTipsToggle,
  showVisualTips,
  isTogglingVisualTips,
  chatContainerRef,
  onCompletedNextStep,
  showStep3Content,
  chatSteps
}: {
  messages: Message[];
  showOptions: boolean;
  showGenres: boolean;
  showReadyButton: boolean;
  showStepContent: boolean;
  showCompletedStep: boolean;
  currentStep: number;
  readyButtonHighlighted: boolean;
  completedStepText: string;
  onOptionClick: (option: string) => void;
  onGenreClick: (genre: string) => void;
  onReadyClick: () => void;
  onVisualTipsToggle: () => void;
  showVisualTips: boolean;
  isTogglingVisualTips: boolean;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  onCompletedNextStep: () => void;
  showStep3Content: boolean;
  chatSteps: any[];
}) => {
  return (
        <div 
          ref={chatContainerRef} 
          className="absolute top-[95px] left-[10px] bottom-[140px] overflow-y-auto"
          style={{ 
            scrollBehavior: isTogglingVisualTips ? 'auto' : 'smooth',
            width: showVisualTips ? '357px' : '357px',
            transition: isTogglingVisualTips ? 'none' : 'width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            backgroundColor: 'rgba(110, 36, 171, 0.05)',
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(110, 36, 171, 0.08), transparent 70%)'
          }}
        >
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message.content}
          isTyping={message.isTyping}
          isThinking={message.isThinking}
          isUser={message.type === 'user'}
          avatar={message.type === 'ai' ? "https://c.animaapp.com/hOiZ2IT6/img/b56f1665-0403-49d2-b00e-ec2a27378422-1@2x.png" : undefined}
        />
      ))}



      {/* Опции из данных шагов */}
      {(() => {
        const currentStepData = chatSteps.find(step => step.id === currentStep);
        if (currentStepData && currentStepData.options) {
          // Показываем опции только если AI закончил печатать
          const shouldShowOptions = showOptions || showGenres || showReadyButton;
          if (!shouldShowOptions) return null;
          
          return (
            <div className="flex flex-col gap-3 items-end mb-3">
              {currentStepData.options.map((option: string) => (
                <ChatButton
                  key={option}
                  text={option === "Show visual tips" ? (showVisualTips ? "Hide visual tips" : "Show visual tips") : option}
                  onClick={() => onOptionClick(option)}
                  variant="option"
                  isVisible={true}
                  className="animate-fadeIn"
                />
              ))}
            </div>
          );
        }
        return null;
      })()}






      {/* Кнопка "Completed. Next step." */}
      {showCompletedStep && (
        <div className="flex justify-end mb-3">
          <ChatButton
            text={completedStepText}
            onClick={onCompletedNextStep}
            variant="primary"
            className="w-[298px] animate-fadeIn"
          />
        </div>
      )}

      {/* Step 3 Content - Project Analysis */}
      {showStep3Content && (
        <div className="mt-4">
          <Step3Content />
        </div>
      )}
    </div>
  );
});

export const FunctionalChat = (): JSX.Element => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [projectName, setProjectName] = useState("New Project");
  const [userInput, setUserInput] = useState("");
  
  const [showOptions, setShowOptions] = useState(false);
  const [showGenres, setShowGenres] = useState(false);
  const [showReadyButton, setShowReadyButton] = useState(false);
  const [readyButtonHighlighted, setReadyButtonHighlighted] = useState(false);
  const [, setReadyButtonClicked] = useState(false);
  const [showStepContent, setShowStepContent] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCompletedStep, setShowCompletedStep] = useState(false);
  const [completedStepText, setCompletedStepText] = useState("");
  const [showLearnMode, setShowLearnMode] = useState(false);
  const [selectedLearnLevel, setSelectedLearnLevel] = useState("learn");
  const [showVisualTips, setShowVisualTips] = useState(false);
  const [showProjectAnalysis, setShowProjectAnalysis] = useState(false);
  const [showAnalysingChannels, setShowAnalysingChannels] = useState(false);
  const [showAnalysisWarning, setShowAnalysisWarning] = useState(false);
  const [showStep3Content] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const [isTogglingVisualTips, setIsTogglingVisualTips] = useState(false);
  const savedScrollPositionRef = useRef<number>(0);

  // Получаем название проекта из localStorage
  useEffect(() => {
    const selectedProjectData = localStorage.getItem('sairyne_selected_project');
    if (selectedProjectData) {
      try {
        const project = JSON.parse(selectedProjectData);
        if (project && project.name) {
          setProjectName(project.name);
        }
      } catch (error) {
        console.error('Error parsing selected project:', error);
      }
    }
  }, []);

  // Полная последовательность чата из Chat1-Chat5
  const chatSteps = [
    {
      id: 0,
      ai: `What you'd like to do with ${projectName}? Select your choice or simply type in what you'd like to do.`,
      options: ["Create new song from scratch", "Help with current song", "Create remix"],
      nextStep: 1
    },
    {
      id: 1,
      ai: "Select the genre of the song or type in.",
      options: ["House", "Techno", "Trance", "Drum & Bass"],
      nextStep: 2
    },
    {
      id: 2,
      ai: "Creating the plan for House creation process...",
      isThinking: true,
      nextStep: 3
    },
    {
      id: 3,
      ai: "Perfect, let's create a track in the House style.\n\nTo make things simple, we'll break the process down into clear steps:\n\nSet up the project (tempo, time signature, basic settings).\nBuild the rhythm (kick, hi-hats, clap).\nCreate the bassline.\nAdd chords and pads.\nLayer melodic elements and leads.\nEnhance with effects and transitions.\nBalance levels and shape the full track structure.\n\n💡 At any point, you can ask questions or request extra guidance — I'll provide more details so you fully understand the process.\n\nAre you ready to start with Step 1 — Project Setup?",
      options: ["I'm ready! Let's start!"],
      nextStep: 4
    },
    {
      id: 4,
      ai: "🟢 Step 1 of 7 — Project Setup\n\nIn House music, the foundation is usually a tempo of 120–125 BPM and a 4/4 time signature.\n\nWhy?\n\nTempo (124 BPM): This speed feels energetic but still groovy — perfect for dancing.\n\nTime Signature (4/4): Almost every House track uses this because it creates the steady, driving pulse you hear in clubs.\n\nLet's set your project to:\n\nTempo: 124 BPM\nTime Signature: 4/4\n\nOn the right, you'll see a visual guide highlighting where to adjust these settings in Ableton.\n\nWhen you're ready, type \"done\" and we'll move on to Step 2 — Rhythm. 🎵",
      options: ["Show visual tips"],
      nextStep: 5
    },
    {
      id: 5,
      ai: "🟢 Step 2 of 7 — Kick Drum\n\nThe kick drum is the foundation of any House track - it provides the driving force that makes people move on the dancefloor. In House music, the kick typically hits on every beat (1-2-3-4), creating that signature four-on-the-floor rhythm.\n\nHere's our plan:\n\nAdd Drum Rack - Set up your drum container\nLoad kick sample - Find the perfect House kick sound\nCreate MIDI pattern - Program the classic 4/4 rhythm\n\nEach step builds on the previous one, so we'll take it nice and slow. I'll show you exactly where to click and what to drag.\n\nLet's start by adding the Drum Rack instrument! Check out the visual guide on the right to see exactly how to do it. →\n\nOnce you've added the Drum Rack, let me know and we'll move on to finding the perfect kick sample!",
      options: ["Show visual tips"],
      nextStep: 6
    },
    {
      id: 6,
      ai: "✅ Kick drum setup completed. Proceed to next phase."
    }
  ];

  // Автоскролл к низу чата
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Добавляем AI сообщение с анимацией печатания
  const addAIMessage = useCallback((content: string, onComplete?: () => void, isThinking?: boolean) => {
    const message: Message = {
      id: `ai-${Date.now()}`,
      type: 'ai',
      content: '',
      timestamp: Date.now(),
      isTyping: true,
      isThinking
    };

    setMessages(prev => [...prev, message]);
    // Не делаем автоскролл во время переключения Visual Tips
    if (true) {
      scrollToBottom();
    }

    let index = 0;
    const typeNextChar = () => {
      if (index < content.length) {
        const currentText = content.substring(0, index + 1);
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
        if (onComplete) {
          setTimeout(onComplete, 300);
        }
      }
    };
    
    setTimeout(typeNextChar, 500);
  }, []);

  // Добавляем пользовательское сообщение
  const addUserMessage = (content: string) => {
    const message: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, message]);
    // Не делаем автоскролл во время переключения Visual Tips
    if (true) {
      scrollToBottom();
    }
  };


  // Обработка отправки сообщения
  const handleSendMessage = () => {
    if (userInput.trim()) {
      // Добавляем сообщение пользователя в чат
      addUserMessage(userInput.trim());
      
      // Если это сообщение "I'm ready! Let's start!", подсвечиваем кнопку
      if (userInput.trim() === "I'm ready! Let's start!") {
        setReadyButtonHighlighted(true);
      }
      
      // Скрываем все опции после отправки сообщения
      setShowOptions(false);
      setShowGenres(false);
      setShowReadyButton(false);
      setShowStepContent(false);
      setShowCompletedStep(false);
      setCompletedStepText("");
      

      // Находим текущий шаг и переходим к следующему
      const currentStepData = chatSteps.find(step => step.id === currentStep);
      if (currentStepData && currentStepData.nextStep !== undefined) {
        const nextStep = chatSteps[currentStepData.nextStep];
        if (nextStep) {
          // Если это шаг "thinking" (id: 2), показываем прозрачный текст с задержкой
          if (nextStep.isThinking) {
            addAIMessage(nextStep.ai, () => {
              // После показа thinking сообщения, исчезает через 2 секунды и переходим к следующему шагу
              setTimeout(() => {
                // Удаляем thinking сообщение
                setMessages(prev => prev.filter(msg => !msg.isThinking));
                
                // Переходим к следующему шагу
                const realNextStep = chatSteps[nextStep.nextStep];
                if (realNextStep) {
                  setCurrentStep(nextStep.nextStep);
                  addAIMessage(realNextStep.ai, () => {
                    if (realNextStep.id === 3) {
                      setShowReadyButton(true);
                      // Кнопка появляется с прозрачным background, без подсветки
                    }
                  });
                }
              }, 2000); // 2 секунды задержка для "thinking"
            }, true); // true = прозрачный текст
          } else {
            setTimeout(() => {
              setCurrentStep(currentStepData.nextStep);
              addAIMessage(nextStep.ai, () => {
                // Показываем соответствующие опции для следующего шага после завершения анимации
                setTimeout(() => {
                  if (nextStep.id === 1) {
                    setShowGenres(true);
                  } else if (nextStep.id === 3) {
                    setShowReadyButton(true);
                  } else if (nextStep.id === 4) {
                    setShowStepContent(true);
                    // Показываем опции для шага 4 (Show visual tips, Completed. Next step.)
                    setTimeout(() => {
                      setShowOptions(true);
                      // Показываем "Completed. Next step." после завершения анимации
                      setTimeout(() => {
                        setShowCompletedStep(true);
                        // Анимация печатания для "Completed. Next step."
                        const text = "Completed. Next step.";
                        let charIndex = 0;
                        const typeTimer = setInterval(() => {
                          if (charIndex < text.length) {
                            setCompletedStepText(text.substring(0, charIndex + 1));
                            charIndex++;
                          } else {
                            clearInterval(typeTimer);
                          }
                        }, 50); // Скорость печатания
                      }, 3000); // Задержка после завершения анимации печатания
                    }, 500); // Задержка после завершения анимации печатания
                  } else if (nextStep.id === 5) {
                    setShowStepContent(true);
                    // Для Step 5 (Step 2 of 7 — Kick Drum) показываем кнопку "Show visual tips" 
                    // после завершения анимации печатания, аналогично Step 4
                    setTimeout(() => {
                      setShowOptions(true);
                    }, 500); // Задержка после завершения анимации печатания
                  }
                }, 500); // Задержка после завершения анимации печатания
              });
            }, 1200);
          }
        }
      }
      
      // Очищаем поле ввода
      setUserInput("");
    }
  };

  // Обработка нажатия Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Инициализация первого сообщения
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      const firstStep = chatSteps[0];
      addAIMessage(firstStep.ai, () => {
        setCurrentStep(0);
        // Показываем опции после завершения анимации печатания
        setTimeout(() => {
          setShowOptions(true);
        }, 500); // Небольшая задержка после завершения анимации
      });
    }
  }, [chatSteps, addAIMessage]);

  // Автоскролл при добавлении новых сообщений
  useEffect(() => {
    // Не делаем автоскролл во время переключения Visual Tips
    if (true) {
      scrollToBottom();
    }
  }, [messages, showOptions, showGenres, showReadyButton, showStepContent, showCompletedStep, isTogglingVisualTips]);

  // Сохраняем позицию скролла при изменении showVisualTips
  useLayoutEffect(() => {
    if (isTogglingVisualTips && chatContainerRef.current) {
      // Принудительно восстанавливаем позицию скролла до того, как браузер отрисует изменения
      chatContainerRef.current.scrollTop = savedScrollPositionRef.current;
      
      // Агрессивно блокируем скролл
      chatContainerRef.current.style.overflow = 'hidden';
      chatContainerRef.current.style.scrollBehavior = 'auto';
      
      // Дополнительная проверка через requestAnimationFrame для надежности
      requestAnimationFrame(() => {
        if (chatContainerRef.current && isTogglingVisualTips) {
          chatContainerRef.current.scrollTop = savedScrollPositionRef.current;
          chatContainerRef.current.style.overflow = 'hidden';
        }
      });
    }
  }, [showVisualTips, isTogglingVisualTips]);


  const handleAnalyze = useCallback(() => {
    // Если идет процесс анализа, показываем предупреждение
    if (showAnalysingChannels) {
      setShowAnalysisWarning(true);
      return;
    }
    
    // Если открываем Project Analysis, закрываем Visual Tips
    if (!showProjectAnalysis) {
      setShowVisualTips(false);
    }
    setShowProjectAnalysis(!showProjectAnalysis);
  }, [showProjectAnalysis, showAnalysingChannels]);

  const handleStartAnalysis = useCallback(() => {
    setShowProjectAnalysis(false);
    setShowAnalysingChannels(true);
  }, []);

  const handleCancelAnalysis = useCallback(() => {
    setShowAnalysingChannels(false);
    setShowProjectAnalysis(true);
  }, []);

  const handleCloseAnalysis = useCallback(() => {
    setShowAnalysingChannels(false);
  }, []);

  const handleLearn = useCallback(() => {
    console.log("Learn clicked");
    setShowLearnMode(!showLearnMode);
  }, [showLearnMode]);

  const handleLearnLevelSelect = useCallback((level: string) => {
    setSelectedLearnLevel(level);
  }, []);

  const handleCloseLearnMode = useCallback(() => {
    setShowLearnMode(false);
  }, []);

  const handleCloseAnalysisWarning = useCallback(() => {
    setShowAnalysisWarning(false);
  }, []);

  // Функция для получения названия уровня
  const getLevelName = (level: string) => {
    switch (level) {
      case "learn": return "Learn";
      case "create": return "Create";
      case "pro": return "Pro";
      default: return "Learn";
    }
  };

  const handleSidebarClose = useCallback(() => {
    setShowSidebar(false);
  }, []);

  const handleCloseApp = useCallback(() => {
    // Закрываем приложение
    window.close();
  }, []);

  const handleMinimizeApp = useCallback(() => {
    // Сворачиваем приложение (работает в Electron)
    if ('minimize' in window) {
      (window as any).minimize();
    }
  }, []);

  const handleVisualTipsToggle = useCallback(() => {
    // Если открываем Visual Tips, закрываем Project Analysis
    if (!showVisualTips) {
      setShowProjectAnalysis(false);
    }
    
    // Сохраняем текущую позицию скролла
    const currentScrollTop = chatContainerRef.current?.scrollTop || 0;
    savedScrollPositionRef.current = currentScrollTop;
    
    // Устанавливаем флаг переключения СРАЗУ
    setIsTogglingVisualTips(true);
    
    // ПОЛНОСТЬЮ БЛОКИРУЕМ скролл на время анимации
    if (chatContainerRef.current) {
      chatContainerRef.current.style.overflow = 'hidden';
      chatContainerRef.current.style.scrollBehavior = 'auto';
      chatContainerRef.current.style.pointerEvents = 'none';
      // Фиксируем позицию скролла
      chatContainerRef.current.scrollTop = savedScrollPositionRef.current;
    }
    
    // Переключаем состояние
    setShowVisualTips(!showVisualTips);
    
    // Восстанавливаем скролл и позицию после завершения transition (500ms)
    setTimeout(() => {
      if (chatContainerRef.current) {
        // Восстанавливаем скролл
        chatContainerRef.current.style.overflow = 'auto';
        chatContainerRef.current.style.scrollBehavior = 'smooth';
        chatContainerRef.current.style.pointerEvents = 'auto';
        
        // Принудительно восстанавливаем позицию скролла
        chatContainerRef.current.scrollTop = savedScrollPositionRef.current;
      }
      
      // Сбрасываем флаг переключения
      setIsTogglingVisualTips(false);
    }, 500);
  }, [showVisualTips]);

  // Обработка клика по опции
  const handleOptionClick = useCallback((option: string) => {
    // Обработка специальных опций - не добавляем в поле ввода
    if (option === "Show visual tips") {
      handleVisualTipsToggle();
      return;
    }
    
    if (option === "Hide visual tips") {
      handleVisualTipsToggle();
      return;
    }
    
    // Для остальных опций помещаем текст в поле ввода
    setUserInput(option);
  }, [handleVisualTipsToggle]);


  const mainContent = (
    <div className={`relative h-[847px] bg-[#413f42] rounded-[10px] overflow-hidden transition-all duration-500 ease-out ${
      showVisualTips || showProjectAnalysis || showAnalysingChannels ? 'w-[766px]' : 'w-[383px]'
    }`} style={{
      transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }}>
      <header className="absolute top-[calc(50.00%_-_416px)] left-0 right-0 flex items-center justify-between px-3 h-5 min-h-[20px]">
        <h1 className="[font-family:'Inter',Helvetica] font-medium text-white text-[13px] text-center tracking-[0] leading-[normal]">
          Sairyne
        </h1>
        
        <div className="flex items-center gap-2">
          {/* Minimize button */}
          <button
            onClick={handleMinimizeApp}
            className="w-5 h-5 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="Minimize application"
          >
            <img
              className="w-[18px] h-[18px]"
              alt="Minimize"
              src={arrowsIcon}
            />
          </button>
          
          {/* Close app button - always visible */}
          <button
            onClick={handleCloseApp}
            className="w-5 h-5 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="Close application"
          >
            <img
              className="w-[14px] h-[14px]"
              alt="Close"
              src={closeIcon}
            />
          </button>
        </div>
      </header>

      {/* Horizontal line extending from chat to Visual Tips */}
      <div className={`absolute top-[67px] left-[3px] h-[1px] bg-white/10 transition-all duration-500 ease-out ${
        showVisualTips || showProjectAnalysis || showAnalysingChannels ? 'w-[1139px]' : 'w-[377px]'
      }`} style={{
        transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }} />

      {/* Vertical line between chat and right panel */}
      {(showVisualTips || showProjectAnalysis || showAnalysingChannels) && (
        <div className="absolute top-[34px] left-[383px] w-[2px] h-[810px] bg-white/20 transition-all duration-500 ease-out z-50" style={{
          transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }} />
      )}

      <main className={`absolute top-[34px] left-[3px] h-[810px] bg-[#141414] rounded-[7px] overflow-hidden transition-all duration-500 ease-out ${
        showVisualTips || showProjectAnalysis || showAnalysingChannels ? 'w-[760px]' : 'w-[377px]'
      }`} style={{
        transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}>
        {/* Left Column - Chat Content */}
        <div className="flex flex-col w-[377px] h-full relative">
            {/* Gradient Background */}
            <div
              className="absolute top-[calc(50.00%_-_429px)] left-[calc(50.00%_-_140px)] w-[278px] h-[278px] bg-[#6e24ab5e] rounded-[139px] blur-[122px]"
              aria-hidden="true"
            />

            {/* Project Header */}
            <div className="absolute top-0 left-[3px]">
              <Frame 
                projectName={projectName} 
                currentStep={currentStep + 1} 
                totalSteps={7}
                completedSteps={completedSteps}
              />
            </div>

            {/* Chat Messages Container - Мемоизированный компонент */}
            <ChatContainer
              messages={messages}
              showOptions={showOptions}
              showGenres={showGenres}
              showReadyButton={showReadyButton}
              showStepContent={showStepContent}
              showCompletedStep={showCompletedStep}
              currentStep={currentStep}
              readyButtonHighlighted={readyButtonHighlighted}
              completedStepText={completedStepText}
              onOptionClick={handleOptionClick}
              onGenreClick={handleOptionClick}
              onReadyClick={() => {
                setReadyButtonClicked(true);
                setUserInput("I'm ready! Let's start!");
              }}
              onVisualTipsToggle={handleVisualTipsToggle}
              showVisualTips={showVisualTips}
              isTogglingVisualTips={isTogglingVisualTips}
              chatContainerRef={chatContainerRef}
              chatSteps={chatSteps}
              onCompletedNextStep={() => {
                // Добавляем сообщение пользователя
                const userMessage: Message = {
                  id: `user-${Date.now()}`,
                  type: 'user',
                  content: "Completed. Next step.",
                  timestamp: Date.now()
                };
                setMessages(prev => [...prev, userMessage]);
                
                // Увеличиваем количество завершенных шагов
                setCompletedSteps(prev => prev + 1);
                
                // Сбрасываем все состояния кнопок
                setShowOptions(false);
                setShowGenres(false);
                setShowReadyButton(false);
                setShowStepContent(false);
                setShowCompletedStep(false);
                setCompletedStepText("");
                
                // Переходим к следующему шагу
                const currentStepData = chatSteps.find(step => step.id === currentStep);
                if (currentStepData && currentStepData.nextStep !== undefined) {
                  const nextStep = chatSteps[currentStepData.nextStep];
                  if (nextStep) {
                    setCurrentStep(currentStepData.nextStep);
            addAIMessage(nextStep.ai, () => {
              // Показываем соответствующие опции для следующего шага после завершения анимации
              setTimeout(() => {
                if (nextStep.id === 1) {
                  setShowGenres(true);
                } else if (nextStep.id === 3) {
                  setShowReadyButton(true);
                } else if (nextStep.id === 4) {
                  setShowStepContent(true);
                  // Показываем опции для шага 4 (Show visual tips, Completed. Next step.)
                  setTimeout(() => {
                    setShowOptions(true);
                    // Показываем "Completed. Next step." после завершения анимации
                    setTimeout(() => {
                      setShowCompletedStep(true);
                      // Анимация печатания для "Completed. Next step."
                      const text = "Completed. Next step.";
                      let charIndex = 0;
                      const typeTimer = setInterval(() => {
                        if (charIndex < text.length) {
                          setCompletedStepText(text.substring(0, charIndex + 1));
                          charIndex++;
                        } else {
                          clearInterval(typeTimer);
                        }
                      }, 50); // Скорость печатания
                    }, 3000); // Задержка после завершения анимации печатания
                  }, 500); // Задержка после завершения анимации печатания
                } else if (nextStep.id === 5) {
                  setShowStepContent(true);
                  // Показываем кнопку "Show visual tips" после завершения анимации
                  setTimeout(() => {
                    setShowOptions(true);
                  }, 500); // Задержка после завершения анимации печатания
                }
              }, 500); // Задержка после завершения анимации печатания
            });
                  }
                }
              }}
              showStep3Content={showStep3Content}
            />

            {/* Поле ввода сообщения */}
            <div className={`absolute bottom-[10px] left-[10px] h-[116px] bg-[#ffffff0d] rounded-[7px] backdrop-blur-[18.5px] transition-all duration-500 ease-out ${
              showVisualTips ? 'w-[357px]' : 'w-[357px]'
            }`} style={{
              transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}>
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
                onClick={handleSendMessage}
              />

              <button
                onClick={handleAnalyze}
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
                onClick={handleLearn}
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
                }}>{getLevelName(selectedLearnLevel)}</span>
                <img
                  className="w-[6.93px] h-[4.5px]"
                  alt="Polygon"
                  src="https://c.animaapp.com/hOiZ2IT6/img/polygon-1-2.svg"
                />
              </button>

              {/* LearnMode */}
              <LearnMode 
                isOpen={showLearnMode}
                onClose={handleCloseLearnMode}
                selectedLevel={selectedLearnLevel}
                onLevelSelect={handleLearnLevelSelect}
              />

              {/* Analysis Warning */}
              <AnalysisWarning 
                isOpen={showAnalysisWarning}
                onClose={handleCloseAnalysisWarning}
              />
            </div>
        </div>

        {/* Right Column - Visual Tips Panel */}
        {showVisualTips && (
          <div 
            className="absolute top-[0px] right-[3px] w-[383px] h-[810px] overflow-y-auto transition-all duration-500 ease-out"
            style={{
              transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
          >
            {/* Visual Tips Header - опущен по вертикали */}
            <div className="absolute top-[10px] left-0 right-0 flex items-center justify-center px-3 h-5">
              {/* Close button in left corner */}
              <button
                onClick={handleVisualTipsToggle}
                className="absolute left-3 w-5 h-5 flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="Close visual tips"
              >
                <img
                  className="w-[14px] h-[14px]"
                  alt="Close"
                  src={closeIcon}
                />
              </button>
              
              <h2 className="[font-family:'DM_Sans',Helvetica] font-medium text-white text-[13px] tracking-[0] leading-[normal]">
                Visual tips
              </h2>
            </div>

            {/* Horizontal line for Visual Tips - точно как в исходном коде */}
            <div className="absolute top-[39px] left-0 w-[383px] h-[1px] bg-white/10" />

            {/* Visual Tips Content */}
            <div className="pt-[30px]">
              {currentStep === 4 ? (
                <VisualTipsStep4 />
              ) : (
                <VisualTips currentStep={currentStep} />
              )}
            </div>
          </div>
        )}

        {/* Right Column - Project Analysis Panel */}
        {showProjectAnalysis && (
          <div 
            className="absolute top-[0px] right-0 w-[383px] h-[810px] overflow-y-auto transition-all duration-500 ease-out"
            style={{
              transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
          >
            {/* Project Analysis Content */}
            <div className="pt-0">
              <ProjectAnalysis 
                onStartAnalysis={handleStartAnalysis} 
                onClose={handleAnalyze}
              />
            </div>
          </div>
        )}

        {/* Right Column - Analysing Channels Panel */}
        {showAnalysingChannels && (
          <div 
            className="absolute top-[0px] right-0 w-[383px] h-[810px] overflow-y-auto transition-all duration-500 ease-out"
            style={{
              transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
          >
            {/* Analysing Channels Content */}
            <div className="pt-0">
              <AnalysingChannels 
                onCancelAnalysis={handleCancelAnalysis}
                onClose={handleCloseAnalysis}
              />
            </div>
          </div>
        )}
      </main>

      {/* Sidebar Menu */}
      <SidebarMenu 
        isVisible={showSidebar} 
        onClose={handleSidebarClose} 
      />
    </div>
  );

  return mainContent;
};