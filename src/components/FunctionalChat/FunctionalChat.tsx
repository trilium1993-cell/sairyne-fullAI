import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { Frame } from "../Frame";
import { ChatMessage } from "../ChatMessage";
import { ChatButton } from "../ChatButton";
import { SidebarMenu } from "../SidebarMenu";
import { LearnMode } from "../../screens/LearnMode";
import { AnalysisWarning } from "../AnalysisWarning";
import { Step3Content } from "../Step3Content";
import { VisualTips } from "../VisualTips";
import { ProjectAnalysis } from "../ProjectAnalysis";
import { AnalysingChannels } from "../AnalysingChannels";
import { AnalysisSummary } from "../AnalysisSummary";
import { FixIssuesChat } from "../FixIssuesChat";
import AnalysisPopup from "../AnalysisPopup";
import { ErrorBoundary } from "../ErrorBoundary";
import { createChatSteps } from "../../data/chatSteps";
import { WINDOW, ANIMATION } from "../../constants/dimensions";
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
          className="absolute top-[50px] left-[10px] bottom-[140px] overflow-y-auto"
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

interface FunctionalChatProps {
  onNext?: () => void;
  onBack?: () => void;
}

export const FunctionalChat = ({ onNext, onBack }: FunctionalChatProps = {}): JSX.Element => {
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
  const [showAnalysisSummary, setShowAnalysisSummary] = useState(false);
  const [showFixIssuesChat, setShowFixIssuesChat] = useState(false);
  const [showStep3Content] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [hasCompletedAnalysis, setHasCompletedAnalysis] = useState(false);
  const [showAnalysisPopup, setShowAnalysisPopup] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const [isTogglingVisualTips, setIsTogglingVisualTips] = useState(false);
  const savedScrollPositionRef = useRef<number>(0);
  const analysisTimeoutRef = useRef<number | null>(null);

  // Получаем название проекта и пользователя из localStorage
  useEffect(() => {
    const selectedProjectData = localStorage.getItem('sairyne_selected_project');
    if (selectedProjectData) {
      try {
        const project = JSON.parse(selectedProjectData);
        if (project && project.name) {
          setProjectName(project.name);
        }
      } catch (error) {
        // В случае ошибки используем дефолтное название
      }
    }

    // Получаем информацию о текущем пользователе
    const currentUserData = localStorage.getItem('sairyne_current_user');
    if (currentUserData) {
      try {
        const user = JSON.parse(currentUserData);
        if (user && user.email) {
          // Можно добавить отображение email пользователя в UI
          console.log('Current user:', user.email);
        }
      } catch (error) {
        // В случае ошибки игнорируем
      }
    }
  }, []);

  // Создаем шаги чата с актуальным названием проекта
  const chatSteps = createChatSteps(projectName);

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
    
    // Если пользователь уже делал анализ, показываем popup с опциями
    if (hasCompletedAnalysis) {
      setShowAnalysisPopup(true);
      return;
    }
    
    // Если открываем Project Analysis, закрываем все другие окна
    if (!showProjectAnalysis) {
      setShowVisualTips(false);
      setShowAnalysingChannels(false);
      setShowAnalysisSummary(false);
    }
    setShowProjectAnalysis(!showProjectAnalysis);
  }, [showProjectAnalysis, showAnalysingChannels, hasCompletedAnalysis]);

  const handleStartAnalysis = useCallback(() => {
    setShowProjectAnalysis(false);
    setShowAnalysingChannels(true);
    
    // Отменяем предыдущий таймер, если он есть
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
    
    // Имитация FFT обработки - через 5 секунд показываем Analysis Summary
    analysisTimeoutRef.current = setTimeout(() => {
      setShowAnalysingChannels(false);
      setShowAnalysisSummary(true);
      setHasCompletedAnalysis(true); // Отмечаем, что анализ был выполнен
      analysisTimeoutRef.current = null;
    }, 5000); // 5 секунд на "анализ"
  }, []);

  const handleCancelAnalysis = useCallback(() => {
    // ✅ ОТМЕНЯЕМ ТАЙМЕР АНАЛИЗА
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
    
    setShowAnalysingChannels(false);
    setShowProjectAnalysis(true);
  }, []);

  const handleCloseAnalysisSummary = useCallback(() => {
    setShowAnalysisSummary(false);
  }, []);

  const handleCloseFixIssuesChat = useCallback(() => {
    setShowFixIssuesChat(false);
  }, []);

  const handleShowLastAnalysis = useCallback(() => {
    // Закрываем все другие окна перед показом Analysis Summary
    setShowVisualTips(false);
    setShowProjectAnalysis(false);
    setShowAnalysingChannels(false);
    setShowAnalysisSummary(true);
  }, []);

  const handleAnalysisPopupReanalysis = useCallback(() => {
    // Закрываем все другие окна и перезапускаем анализ
    setShowVisualTips(false);
    setShowProjectAnalysis(false);
    setShowAnalysisSummary(false);
    setShowAnalysingChannels(true);
    
    // Отменяем предыдущий таймер, если он есть
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
    
    analysisTimeoutRef.current = setTimeout(() => {
      setShowAnalysingChannels(false);
      setShowAnalysisSummary(true);
      analysisTimeoutRef.current = null;
    }, 5000);
  }, []);

  const handleReanalyse = useCallback(() => {
    // Перезапускаем анализ
    setShowAnalysisSummary(false);
    setShowAnalysingChannels(true);
    
    // Отменяем предыдущий таймер, если он есть
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
    
    analysisTimeoutRef.current = setTimeout(() => {
      setShowAnalysingChannels(false);
      setShowAnalysisSummary(true);
      analysisTimeoutRef.current = null;
    }, 5000);
  }, []);

  const handleFixIssues = useCallback((sectionTitle: string) => {
    console.log(`Fix issues for: ${sectionTitle}`);
    // Показываем окно FixIssuesChat только для первого checkpoint (Critical Issues)
    if (sectionTitle === "Critical Issues") {
      setShowFixIssuesChat(true);
    }
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
    // Если открываем Visual Tips, закрываем все другие окна
    if (!showVisualTips) {
      setShowProjectAnalysis(false);
      setShowAnalysingChannels(false);
      setShowAnalysisSummary(false);
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
    }, ANIMATION.DURATION);
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
    <div 
      className={`relative bg-[#413f42] overflow-hidden transition-all ease-out`}
      style={{
        height: `${WINDOW.OUTER_HEIGHT}px`,
        width: showVisualTips || showProjectAnalysis || showAnalysingChannels || showAnalysisSummary ? `${WINDOW.EXPANDED_WIDTH}px` : `${WINDOW.OUTER_WIDTH}px`,
        borderRadius: `${WINDOW.OUTER_BORDER_RADIUS}px`,
        transitionDuration: `${ANIMATION.DURATION}ms`,
        transitionTimingFunction: ANIMATION.TIMING_FUNCTION
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
      {(showVisualTips || showProjectAnalysis || showAnalysingChannels || showAnalysisSummary) && (
        <div 
          className="absolute bg-white/20 transition-all ease-out"
          style={{
            top: `${WINDOW.INNER_TOP}px`,
            left: `${WINDOW.DIVIDER_LEFT}px`,
            width: `${WINDOW.DIVIDER_WIDTH}px`,
            height: `${WINDOW.OUTER_HEIGHT - WINDOW.INNER_TOP}px`,
            transitionDuration: `${ANIMATION.DURATION}ms`,
            transitionTimingFunction: ANIMATION.TIMING_FUNCTION,
            zIndex: 25
          }}
        />
      )}

      <main 
        className="absolute bg-[#141414] overflow-hidden transition-all ease-out"
        style={{
          top: `${WINDOW.INNER_TOP}px`,
          left: `${WINDOW.INNER_LEFT}px`,
          height: `${WINDOW.INNER_HEIGHT}px`,
          width: showVisualTips || showProjectAnalysis || showAnalysingChannels || showAnalysisSummary ? '760px' : `${WINDOW.INNER_WIDTH}px`,
          borderRadius: `${WINDOW.INNER_BORDER_RADIUS}px`,
          transitionDuration: `${ANIMATION.DURATION}ms`,
          transitionTimingFunction: ANIMATION.TIMING_FUNCTION
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
                onBackToProjects={onBack}
              />
            </div>

            {/* Chat Messages Container - Мемоизированный компонент или FixIssuesChat */}
            {showFixIssuesChat ? (
              <div className="absolute top-[95px] left-[10px] bottom-[140px] overflow-y-auto w-[357px]" style={{
                backgroundColor: 'rgba(110, 36, 171, 0.05)',
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(110, 36, 171, 0.08), transparent 70%)'
              }}>
                <FixIssuesChat 
                  onClose={handleCloseFixIssuesChat}
                  existingMessages={messages}
                />
              </div>
            ) : (
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
            )}

            {/* Поле ввода сообщения */}
            <div className={`absolute bottom-[10px] left-[10px] h-[116px] bg-[#ffffff0d] rounded-[7px] backdrop-blur-[18.5px] transition-all duration-500 ease-out ${
              showVisualTips ? 'w-[357px]' : 'w-[357px]'
            } ${userInput ? 'ring-2 ring-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : ''}`} style={{
              transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
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
                disabled={currentStep < 5}
                className={`absolute bottom-[6px] right-[268px] flex items-center gap-1 rounded-[6px] px-[7px] py-[7px] transition-all duration-300 ease-out ${
                  currentStep < 5 
                    ? 'bg-[#21182940] border border-solid border-[#e8ceff10] cursor-not-allowed opacity-50' 
                    : 'bg-[#211829] border border-solid border-[#e8ceff21] cursor-pointer hover:bg-[#2a1f35] hover:border-[#e8ceff40]'
                }`}
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
              <ErrorBoundary componentName="LearnMode">
                <LearnMode 
                  isOpen={showLearnMode}
                  onClose={handleCloseLearnMode}
                  selectedLevel={selectedLearnLevel}
                  onLevelSelect={handleLearnLevelSelect}
                />
              </ErrorBoundary>

              {/* Analysis Warning */}
              <ErrorBoundary componentName="AnalysisWarning">
                <AnalysisWarning 
                  isOpen={showAnalysisWarning}
                  onClose={handleCloseAnalysisWarning}
                />
              </ErrorBoundary>

              {/* Analysis Popup */}
              <ErrorBoundary componentName="AnalysisPopup">
                <AnalysisPopup 
                  isVisible={showAnalysisPopup}
                  onClose={() => setShowAnalysisPopup(false)}
                  onShowLastAnalysis={handleShowLastAnalysis}
                  onReanalysis={handleAnalysisPopupReanalysis}
                />
              </ErrorBoundary>
            </div>
        </div>

        {/* Right Column - Visual Tips Panel */}
        {showVisualTips && !showProjectAnalysis && !showAnalysingChannels && !showAnalysisSummary && (
          <div 
            className="absolute overflow-y-auto transition-all ease-out overscroll-none"
            style={{
              top: 0,
              right: `${WINDOW.INNER_LEFT}px`,
              width: `${WINDOW.RIGHT_PANEL_WIDTH}px`,
              height: `${WINDOW.INNER_HEIGHT}px`,
              transitionDuration: `${ANIMATION.DURATION}ms`,
              transitionTimingFunction: ANIMATION.TIMING_FUNCTION
            }}
          >
            {/* Visual Tips Header - sticky */}
            <div className="sticky top-0 left-0 right-0 z-50 bg-[#141414] h-[40px]">
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

              {/* Horizontal line for Visual Tips */}
              <div className="absolute bottom-0 left-0 w-[383px] h-[1px] bg-white/10" />
            </div>

            {/* Visual Tips Content */}
            <div className="pt-[40px]">
              <ErrorBoundary 
                componentName="VisualTips"
                fallback={
                  <div className="p-4 text-center text-gray-500">
                    Visual Tips temporarily unavailable
                  </div>
                }
              >
                <VisualTips currentStep={currentStep} />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Right Column - Project Analysis Panel */}
        {showProjectAnalysis && !showVisualTips && !showAnalysingChannels && !showAnalysisSummary && (
          <div 
            className="absolute overflow-y-auto transition-all ease-out"
            style={{
              top: 0,
              right: `${WINDOW.INNER_LEFT}px`,
              width: `${WINDOW.RIGHT_PANEL_WIDTH}px`,
              height: `${WINDOW.INNER_HEIGHT}px`,
              transitionDuration: `${ANIMATION.DURATION}ms`,
              transitionTimingFunction: ANIMATION.TIMING_FUNCTION
            }}
          >
            {/* Project Analysis Content */}
            <div className="pt-0">
              <ErrorBoundary 
                componentName="ProjectAnalysis"
                fallback={
                  <div className="p-4 text-center text-gray-500">
                    Analysis panel temporarily unavailable
                  </div>
                }
              >
                <ProjectAnalysis 
                  onStartAnalysis={handleStartAnalysis} 
                  onClose={handleAnalyze}
                />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Right Column - Analysing Channels Panel */}
        {showAnalysingChannels && !showVisualTips && !showProjectAnalysis && !showAnalysisSummary && (
          <div 
            className="absolute overflow-y-auto transition-all ease-out"
            style={{
              top: 0,
              right: `${WINDOW.INNER_LEFT}px`,
              width: `${WINDOW.RIGHT_PANEL_WIDTH}px`,
              height: `${WINDOW.INNER_HEIGHT}px`,
              transitionDuration: `${ANIMATION.DURATION}ms`,
              transitionTimingFunction: ANIMATION.TIMING_FUNCTION
            }}
          >
            {/* Analysing Channels Content */}
            <div className="pt-0">
              <ErrorBoundary 
                componentName="AnalysingChannels"
                fallback={
                  <div className="p-4 text-center text-gray-500">
                    Analysis animation temporarily unavailable
                  </div>
                }
              >
                <AnalysingChannels 
                  onCancelAnalysis={handleCancelAnalysis}
                  onClose={handleCloseAnalysis}
                />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Right Column - Analysis Summary Panel */}
        {showAnalysisSummary && !showVisualTips && !showProjectAnalysis && !showAnalysingChannels && (
          <div 
            className="absolute overflow-y-auto transition-all ease-out"
            style={{
              top: 0,
              right: `${WINDOW.INNER_LEFT}px`,
              width: `${WINDOW.RIGHT_PANEL_WIDTH}px`,
              height: `${WINDOW.INNER_HEIGHT}px`,
              transitionDuration: `${ANIMATION.DURATION}ms`,
              transitionTimingFunction: ANIMATION.TIMING_FUNCTION
            }}
          >
            {/* Analysis Summary Content */}
            <div className="pt-0">
              <ErrorBoundary 
                componentName="AnalysisSummary"
                fallback={
                  <div className="p-4 text-center text-gray-500">
                    Analysis summary temporarily unavailable
                  </div>
                }
              >
                <AnalysisSummary 
                  onClose={handleCloseAnalysisSummary}
                  onReanalyse={handleReanalyse}
                  onFixIssues={handleFixIssues}
                />
              </ErrorBoundary>
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