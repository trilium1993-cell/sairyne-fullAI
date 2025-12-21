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
import { ChatService } from "../../services/chatService";
import closeIcon from '../../assets/img/vector.svg';
import { resolveIsEmbedded } from "../../utils/embed";
import { AnalyticsService } from "../../services/analyticsService";
import { getLatestProject, getSelectedProject, setSelectedProject } from "../../services/projects";
import { getActiveUserEmail } from "../../services/auth";
import { safeGetItem, safeSetItem } from "../../utils/storage";

const SEND_ICON = "https://c.animaapp.com/hOiZ2IT6/img/frame-13-1.svg";
const ANALYSIS_ICON = "https://c.animaapp.com/hOiZ2IT6/img/waveform-light-1-1.svg";
const LEARN_ICON = "https://c.animaapp.com/hOiZ2IT6/img/stack-1-1.svg";
const CARET_ICON = "https://c.animaapp.com/hOiZ2IT6/img/polygon-1-2.svg";
const IS_DEV = Boolean((import.meta as any)?.env?.DEV);

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
  chatSteps,
  selectedLearnLevel
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
  selectedLearnLevel: string;
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
        />
      ))}



      {/* Опции из данных шагов */}
      {(() => {
        // В Pro Mode не показываем статичные опции
        if (selectedLearnLevel === 'pro') return null;
        
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
  onBack?: () => void;
}

export const FunctionalChat = ({ onBack }: FunctionalChatProps = {}): JSX.Element => {
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
  const [learnModeAIActive, setLearnModeAIActive] = useState(false); // Флаг для AI диалога в Learn mode
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
  const [isOffline, setIsOffline] = useState(() => {
    if (IS_DEV) return false;
    if (typeof navigator === 'undefined') return false;
    return !navigator.onLine;
  });
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [lastOnlineCheck, setLastOnlineCheck] = useState<number | null>(null);
  const [isInterfaceReady, setIsInterfaceReady] = useState(false);
  const isEmbedded = resolveIsEmbedded();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const [isTogglingVisualTips, setIsTogglingVisualTips] = useState(false);
  const savedScrollPositionRef = useRef<number>(0);
  const analysisTimeoutRef = useRef<number | null>(null);
  
  // Сохранение состояния для каждого режима
  interface ModeState {
    messages: Message[];
    currentStep: number;
    scrollPosition: number;
    showOptions: boolean;
    showGenres: boolean;
    showReadyButton: boolean;
    showCompletedStep: boolean;
    completedStepText: string;
  }
  const modeStatesRef = useRef<Record<string, ModeState>>({
    learn: { messages: [], currentStep: 0, scrollPosition: 0, showOptions: false, showGenres: false, showReadyButton: false, showCompletedStep: false, completedStepText: "" },
    create: { messages: [], currentStep: 0, scrollPosition: 0, showOptions: false, showGenres: false, showReadyButton: false, showCompletedStep: false, completedStepText: "" },
    pro: { messages: [], currentStep: 0, scrollPosition: 0, showOptions: false, showGenres: false, showReadyButton: false, showCompletedStep: false, completedStepText: "" }
  });
  const previousModeRef = useRef<string>(selectedLearnLevel);

  const CHAT_STATE_KEY = 'sairyne_functional_chat_state_v1';

  const sanitizeMessages = (msgs: Message[]): Message[] =>
    msgs.map((m) => ({
      ...m,
      isVisible: true,
      isTyping: false,
    }));

  const tryHydrateFromStorage = useCallback(() => {
    try {
      const raw = safeGetItem(CHAT_STATE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return false;

      if (typeof parsed.selectedLearnLevel === 'string') {
        setSelectedLearnLevel(parsed.selectedLearnLevel);
        previousModeRef.current = parsed.selectedLearnLevel;
      }

      if (typeof parsed.completedSteps === 'number') setCompletedSteps(parsed.completedSteps);
      if (typeof parsed.hasCompletedAnalysis === 'boolean') setHasCompletedAnalysis(parsed.hasCompletedAnalysis);

      // Restore mode states
      if (parsed.modeStates && typeof parsed.modeStates === 'object') {
        const restored: any = {};
        ['learn', 'create', 'pro'].forEach((mode) => {
          const st = parsed.modeStates[mode];
          if (st && typeof st === 'object') {
            restored[mode] = {
              messages: Array.isArray(st.messages) ? sanitizeMessages(st.messages) : [],
              currentStep: typeof st.currentStep === 'number' ? st.currentStep : 0,
              scrollPosition: typeof st.scrollPosition === 'number' ? st.scrollPosition : 0,
              showOptions: !!st.showOptions,
              showGenres: !!st.showGenres,
              showReadyButton: !!st.showReadyButton,
              showCompletedStep: !!st.showCompletedStep,
              completedStepText: typeof st.completedStepText === 'string' ? st.completedStepText : '',
            };
          }
        });
        if (Object.keys(restored).length > 0) {
          modeStatesRef.current = {
            learn: restored.learn ?? modeStatesRef.current.learn,
            create: restored.create ?? modeStatesRef.current.create,
            pro: restored.pro ?? modeStatesRef.current.pro,
          };
        }
      }

      // Apply current mode state to UI
      const active = previousModeRef.current || 'learn';
      const savedState = modeStatesRef.current[active];
      if (savedState) {
        setMessages([...savedState.messages]);
        setCurrentStep(savedState.currentStep);
        setShowOptions(savedState.showOptions);
        setShowGenres(savedState.showGenres);
        setShowReadyButton(savedState.showReadyButton);
        setShowCompletedStep(savedState.showCompletedStep);
        setCompletedStepText(savedState.completedStepText);

        requestAnimationFrame(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = savedState.scrollPosition ?? 0;
          }
        });
      }

      return true;
    } catch (e) {
      console.warn('[FunctionalChat] Failed to hydrate chat state:', e);
      return false;
    }
  }, []);

  // Инициализация состояния для текущего режима при первом рендере
  useEffect(() => {
    // 1) Try hydrate chat state early
    tryHydrateFromStorage();

    // 2) If data arrives from JUCE later, re-hydrate once
    const onDataLoaded = (e: any) => {
      const key = e?.detail?.key;
      if (key === CHAT_STATE_KEY || key === 'sairyne_selected_project' || key === 'sairyne_projects') {
        tryHydrateFromStorage();
        // Also refresh project name when selected project data arrives late
        const selectedProject = getSelectedProject();
        if (selectedProject?.name) {
          setProjectName(selectedProject.name);
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('sairyne-data-loaded', onDataLoaded as any);
    }

    const savedState = modeStatesRef.current[selectedLearnLevel];
    if (savedState && savedState.messages.length > 0) {
      setMessages([...savedState.messages]);
      setCurrentStep(savedState.currentStep);
      setShowOptions(savedState.showOptions);
      setShowGenres(savedState.showGenres);
      setShowReadyButton(savedState.showReadyButton);
      setShowCompletedStep(savedState.showCompletedStep);
      setCompletedStepText(savedState.completedStepText);
    }
    previousModeRef.current = selectedLearnLevel;
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('sairyne-data-loaded', onDataLoaded as any);
      }
    };
  }, []); // Только при монтировании

  // Persist chat state (debounced) so AU/VST3 window reload doesn't wipe it
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const payload = {
          v: 1,
          ownerEmail: getActiveUserEmail(),
          selectedLearnLevel,
          completedSteps,
          hasCompletedAnalysis,
          modeStates: modeStatesRef.current,
          savedAt: Date.now(),
        };
        safeSetItem(CHAT_STATE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn('[FunctionalChat] Failed to persist chat state:', e);
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [selectedLearnLevel, completedSteps, hasCompletedAnalysis, messages.length, currentStep, showOptions, showGenres, showReadyButton, showCompletedStep, completedStepText]);

  // Автоматическое сохранение состояния для текущего режима при изменениях
  useEffect(() => {
    if (chatContainerRef.current && previousModeRef.current) {
      const currentState: ModeState = {
        messages: [...messages],
        currentStep,
        scrollPosition: chatContainerRef.current.scrollTop,
        showOptions,
        showGenres,
        showReadyButton,
        showCompletedStep,
        completedStepText
      };
      modeStatesRef.current[previousModeRef.current] = currentState;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, currentStep, showOptions, showGenres, showReadyButton, showCompletedStep, completedStepText]);

  // Получаем название проекта и пользователя из localStorage
  useEffect(() => {
    const selectedProject = getSelectedProject();
    if (selectedProject && selectedProject.name) {
      setProjectName(selectedProject.name);
    } else {
      const latestProject = getLatestProject();
      if (latestProject) {
        setSelectedProject(latestProject);
        setProjectName(latestProject.name);
      }
    }

    // Получаем информацию о текущем пользователе
    const currentUserData = localStorage.getItem('sairyne_current_user');
    if (currentUserData) {
      try {
        const user = JSON.parse(currentUserData);
        if (user && user.email) {
          // Можно добавить отображение email пользователя в UI
          if (IS_DEV) {
            console.debug('[chat] current user', user.email);
          }
        }
      } catch (error) {
        // В случае ошибки игнорируем
      }
    }
  }, []);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => setIsInterfaceReady(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (IS_DEV) {
      setIsOffline(false);
      setLastOnlineCheck(Date.now());
      return;
    }

    let isMounted = true;

    const evaluateHealth = async () => {
      const healthy = await ChatService.checkHealth();
      if (!isMounted) return;
      if (healthy) {
        setIsOffline(false);
        setLastOnlineCheck(Date.now());
      } else {
        setIsOffline(true);
      }
    };

    const handleOnline = () => {
      setIsOffline(false);
      setLastOnlineCheck(Date.now());
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      evaluateHealth();

      return () => {
        isMounted = false;
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Создаем шаги чата с актуальным названием проекта
  const chatSteps = createChatSteps(projectName);

  // Автоскролл к низу чата с плавной анимацией
  // Scroll to show new AI message once, then let user scroll manually (like ChatGPT)
  const scrollToNewMessage = () => {
    if (chatContainerRef.current) {
      // Scroll to show the new AI message that just appeared
      // Wait for DOM to update before scrolling (50ms delay)
      setTimeout(() => {
        if (chatContainerRef.current) {
          const container = chatContainerRef.current;
          const targetScroll = container.scrollHeight - container.clientHeight;
          container.scrollTop = targetScroll; // Instant scroll, one time only
        }
      }, 50);
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
    // Scroll to the new message once when it appears
    scrollToNewMessage();

    // Split content into words and animate word-by-word with fade-in
    const words = content.split(' ');
    let wordIndex = 0;
    
    const typeNextWord = () => {
      if (wordIndex < words.length) {
        const currentText = words.slice(0, wordIndex + 1).join(' ');
        setMessages(prev => prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, content: currentText }
            : msg
        ));
        wordIndex++;
        // 18ms per word
        setTimeout(typeNextWord, 18);
      } else {
        setMessages(prev => prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, isTyping: false }
            : msg
        ));
        if (onComplete) {
          setTimeout(onComplete, 50);
        }
      }
    };
    
    setTimeout(typeNextWord, 50);
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
    // Scroll to the new message once when it appears
    scrollToNewMessage();
  };


  // Обработка отправки сообщения
  const handleSendMessage = async () => {
    if (!userInput.trim()) {
      console.log('[FunctionalChat] handleSendMessage: Empty input, ignoring');
      return;
    }
    
    const messageText = userInput.trim();
    console.log('[FunctionalChat] handleSendMessage called:', messageText);
    console.log('[FunctionalChat] Current mode:', selectedLearnLevel);
    console.log('[FunctionalChat] Current messages count:', messages.length);
    
    // Очищаем поле ввода сразу
    setUserInput("");
    
    // Проверяем режим: Pro Mode = AI, Create Mode = AI, Learn Mode = статичные шаги (ИЛИ AI активирован после step 6)
    const isProMode = selectedLearnLevel === 'pro';
    const isCreateMode = selectedLearnLevel === 'create';
    const isLearnModeAI = selectedLearnLevel === 'learn' && learnModeAIActive;
    const shouldUseAI = isProMode || isCreateMode || isLearnModeAI;
    
    console.log('[FunctionalChat] Is Pro Mode:', isProMode);
    console.log('[FunctionalChat] Is Create Mode:', isCreateMode);
    console.log('[FunctionalChat] Learn Mode AI Active:', isLearnModeAI);
    console.log('[FunctionalChat] Should Use AI:', shouldUseAI);
    
    if (shouldUseAI) {
      console.log('[FunctionalChat] AI Mode: Processing message', { isProMode, isCreateMode, isLearnModeAI });
      setShowOptions(false);
      setShowGenres(false);
      setShowReadyButton(false);
      setShowStepContent(false);
      setShowCompletedStep(false);
      setCompletedStepText("");

      if (isOffline) {
        console.log('[FunctionalChat] Pro Mode: Offline, showing offline message');
        // Добавляем сообщение пользователя даже в оффлайн режиме
        addUserMessage(messageText);
        addAIMessage("You're currently offline. Please reconnect to the server to continue the AI conversation.");
        return;
      }
      
      // PRO MODE: Используем AI (OpenAI)
      console.log('[FunctionalChat] Pro Mode: Starting AI request');
      
      // Показываем индикатор "AI думает"
      const thinkingId = Date.now().toString();
      
      // Добавляем сообщение пользователя И thinking сообщение в одном обновлении состояния
      setMessages(prev => {
        // Создаем сообщение пользователя
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          type: 'user',
          content: messageText,
          timestamp: Date.now(),
        };
        
        // Добавляем сообщение пользователя и thinking сообщение
        const newMessages: Message[] = [
          ...prev,
          userMessage,
          {
            id: thinkingId,
            type: 'ai' as const,
            content: '...',
            timestamp: Date.now(),
            isThinking: true
          }
        ];
        
        console.log('[FunctionalChat] Pro Mode: Added user message and thinking, total messages:', newMessages.length);
        console.log('[FunctionalChat] Pro Mode: User message:', userMessage.content);
        
        // Скролл к новому сообщению после обновления
        setTimeout(() => scrollToNewMessage(), 50);
        
        // Формируем историю разговора (без thinking сообщения)
        const conversationHistory = newMessages
          .filter(msg => {
            const isValid = !msg.isThinking && !msg.isTyping && msg.content.trim() !== '';
            const isNotSystem = msg.content !== "Completed. Next step." && !msg.content.includes("Completed.");
            return isValid && isNotSystem;
          })
          .map(msg => ({
            type: msg.type,
            content: msg.content
          }));
        
        console.log('[FunctionalChat] Pro Mode: Conversation history length:', conversationHistory.length);
        console.log('[FunctionalChat] Pro Mode: Conversation history:', conversationHistory.map(m => ({ type: m.type, content: m.content.substring(0, 50) })));
        console.log('[FunctionalChat] Pro Mode: Sending to ChatService.sendMessage...');
        
        // Map selectedLearnLevel to AI mode
        let aiMode: 'pro' | 'create' | 'learn' = 'create'; // default
        if (selectedLearnLevel === 'pro') {
          aiMode = 'pro';
        } else if (selectedLearnLevel === 'create') {
          aiMode = 'create';
        } else if (learnModeAIActive) {
          aiMode = 'learn';
        }
        
        // Отправляем запрос асинхронно
        ChatService.sendMessage(messageText, conversationHistory, aiMode)
          .then(aiResponse => {
            console.log('[FunctionalChat] Pro Mode: Received AI response, length:', aiResponse?.length || 0);
            
            // Удаляем индикатор "думает"
            setMessages(prevMsgs => {
              const filtered = prevMsgs.filter(msg => msg.id !== thinkingId);
              console.log('[FunctionalChat] Pro Mode: Removed thinking message, remaining messages:', filtered.length);
              return filtered;
            });
            
            // Добавляем ответ AI с анимацией печатания
            addAIMessage(aiResponse);
            AnalyticsService.track('AIMessageSent', {
              mode: 'pro',
              characters: aiResponse?.length || 0,
            });
            
            console.log('[FunctionalChat] Pro Mode: Message sent successfully');
          })
          .catch(error => {
            console.error('[FunctionalChat] Pro Mode: AI chat error:', error);
            // Удаляем индикатор "думает"
            setMessages(prevMsgs => prevMsgs.filter(msg => !msg.isThinking));
            // Показываем сообщение об ошибке
            addAIMessage("Sorry, I couldn't process your request. Please try again.");
          });
        
        return newMessages;
      });
      
      // Manual scrolling only - let user control
      
      return;
    }
    
    // LEARN/CREATE MODE: Добавляем сообщение пользователя
    addUserMessage(messageText);
    
    // LEARN/CREATE MODE: Статичные шаги (существующая логика)
    // Если это сообщение "I'm ready! Let's start!", подсвечиваем кнопку
    if (messageText === "I'm ready! Let's start!") {
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
              if (nextStep && nextStep.nextStep !== undefined) {
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
              }
            }, 2000); // 2 секунды задержка для "thinking"
          }, true); // true = прозрачный текст
        } else {
          setTimeout(() => {
            if (currentStepData.nextStep !== undefined) {
              setCurrentStep(currentStepData.nextStep);
              const nextStep = chatSteps[currentStepData.nextStep];
              if (nextStep) {
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
                      // Скролл к кнопке
                      scrollToNewMessage();
                    }, 3000); // Задержка после завершения анимации печатания
                  }, 500); // Задержка после завершения анимации печатания
                } else if (nextStep.id === 5) {
                  setShowStepContent(true);
                  // Для Step 5 (Step 2 of 7 — Kick Drum) показываем кнопку "Show visual tips" 
                  // после завершения анимации печатания, аналогично Step 4
                  setTimeout(() => {
                    setShowOptions(true);
                    // Автоматически показываем "Completed. Next step" через 3 секунды
                    // даже если пользователь не нажал "Show visual tips"
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
                      // Скролл к кнопке
                      scrollToNewMessage();
                    }, 3000); // 3 секунды задержка
                  }, 500); // Задержка после завершения анимации печатания
                } else if (nextStep.id === 6) {
                  // Последний шаг Learn mode - показываем кнопку "Completed. Next step" с анимацией
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
                    // Скролл к кнопке
                    scrollToNewMessage();
                  }, 500); // Задержка после завершения анимации печатания
                }
              }, 500); // Задержка после завершения анимации печатания
                });
              }
            }
          }, 1200);
        }
      }
    }
    
    // Очищаем поле ввода
    setUserInput("");
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

  useEffect(() => {
    AnalyticsService.track('PluginOpened', { embedded: isEmbedded });
    return () => {
      AnalyticsService.track('PluginClosed', { embedded: isEmbedded });
    };
  }, [isEmbedded]);

  // Автоскролл при добавлении новых сообщений
  useEffect(() => {
    // Не делаем автоскролл во время переключения Visual Tips
  }, [messages, showOptions, showGenres, showReadyButton, showStepContent, showCompletedStep, isTogglingVisualTips]);

  // Notify host (JUCE wrapper) about expanded state for Visual Tips / Analysis
  useEffect(() => {
    const expanded = (showVisualTips || showProjectAnalysis || showAnalysingChannels || showAnalysisSummary) ? '1' : '0';
    try {
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage(`sairyne:resize:${expanded}`, '*');
      }
    } catch {}
  }, [showVisualTips, showProjectAnalysis, showAnalysingChannels, showAnalysisSummary]);

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
    if (IS_DEV) {
      console.debug('[analysis] fix issues for', sectionTitle);
    }
    // Показываем окно FixIssuesChat только для первого checkpoint (Critical Issues)
    if (sectionTitle === "Critical Issues") {
      setShowFixIssuesChat(true);
    }
  }, []);

  const handleCloseAnalysis = useCallback(() => {
    setShowAnalysingChannels(false);
  }, []);

  const handleLearn = useCallback(() => {
    if (IS_DEV) {
      console.debug('[learn] toggle panel');
    }
    setShowLearnMode((prev) => !prev);
  }, []);

  const handleLearnLevelSelect = useCallback((level: string) => {
    console.log('[FunctionalChat] Switching mode from', previousModeRef.current, 'to', level);
    
    // Если переключаемся на Pro Mode, закрываем FixIssuesChat чтобы показать основной чат
    if (level === 'pro' && showFixIssuesChat) {
      console.log('[FunctionalChat] Closing FixIssuesChat when switching to Pro Mode');
      setShowFixIssuesChat(false);
    }
    
    // Сохраняем текущее состояние перед переключением режима
    if (chatContainerRef.current) {
      const currentState: ModeState = {
        messages: [...messages],
        currentStep,
        scrollPosition: chatContainerRef.current.scrollTop,
        showOptions,
        showGenres,
        showReadyButton,
        showCompletedStep,
        completedStepText
      };
      modeStatesRef.current[previousModeRef.current] = currentState;
      console.log('[FunctionalChat] Saved state for', previousModeRef.current, ':', {
        messagesCount: currentState.messages.length,
        currentStep: currentState.currentStep
      });
    }
    
    // Восстанавливаем сохраненное состояние для нового режима
    const savedState = modeStatesRef.current[level];
    if (savedState) {
      console.log('[FunctionalChat] Restoring state for', level, ':', {
        messagesCount: savedState.messages.length,
        currentStep: savedState.currentStep
      });
      
      setMessages([...savedState.messages]);
      setCurrentStep(savedState.currentStep);
      setShowOptions(savedState.showOptions);
      setShowGenres(savedState.showGenres);
      setShowReadyButton(savedState.showReadyButton);
      setShowCompletedStep(savedState.showCompletedStep);
      setCompletedStepText(savedState.completedStepText);
      
      // Восстанавливаем позицию скролла после рендера
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = savedState.scrollPosition;
        }
      });
    } else {
      // Если режим новый, сбрасываем состояние
      console.log('[FunctionalChat] New mode', level, '- resetting state');
      setMessages([]);
      setCurrentStep(0);
      setShowOptions(false);
      setShowGenres(false);
      setShowReadyButton(false);
      setShowCompletedStep(false);
      setCompletedStepText("");
    }
    
    previousModeRef.current = level;
    setSelectedLearnLevel(level);
    
    console.log('[FunctionalChat] Mode switched to', level);
  }, [messages, currentStep, showOptions, showGenres, showReadyButton, showCompletedStep, completedStepText, showFixIssuesChat]);

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
    AnalyticsService.track('VisualTipClicked', { action: showVisualTips ? 'hide' : 'show' });
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

  const handleReconnect = useCallback(async () => {
    setIsCheckingHealth(true);
    try {
      const healthy = await ChatService.checkHealth();
      if (healthy) {
        setIsOffline(false);
        setLastOnlineCheck(Date.now());
      } else {
        setIsOffline(true);
      }
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  // Обработка клика по опции
  const handleOptionClick = useCallback((option: string) => {
    // Обработка специальных опций - не добавляем в поле ввода
    if (option === "Show visual tips") {
      handleVisualTipsToggle();
      // На шаге 5 (Step 2 of 7) после показания Visual Tips показываем кнопку "Completed. Next step"
      if (currentStep === 5) {
        setTimeout(() => {
          setShowCompletedStep(true);
          setCompletedStepText("Completed. Next step.");
        }, 500);
      }
      return;
    }
    
    if (option === "Hide visual tips") {
      handleVisualTipsToggle();
      return;
    }
    
    // Для остальных опций помещаем текст в поле ввода
    setUserInput(option);
  }, [handleVisualTipsToggle, currentStep]);


  const mainContent = (
    <div 
      className={`relative overflow-hidden transition-all ease-out sairyne-surface bg-[#413f42] text-white ${isInterfaceReady ? 'opacity-100' : 'opacity-0'}`}
      style={{
        height: `${WINDOW.OUTER_HEIGHT}px`,
        width: showVisualTips || showProjectAnalysis || showAnalysingChannels || showAnalysisSummary ? `${WINDOW.EXPANDED_WIDTH}px` : `${WINDOW.OUTER_WIDTH}px`,
        borderRadius: `${WINDOW.OUTER_BORDER_RADIUS}px`,
        transitionDuration: `${ANIMATION.DURATION}ms`,
        transitionTimingFunction: ANIMATION.TIMING_FUNCTION
      }}>
    <div 
      className={`relative overflow-hidden transition-all ease-out sairyne-surface bg-[#413f42] text-white ${isInterfaceReady ? 'opacity-100' : 'opacity-0'}`}
      style={{
        height: `${WINDOW.OUTER_HEIGHT}px`,
        width: showVisualTips || showProjectAnalysis || showAnalysingChannels || showAnalysisSummary ? `${WINDOW.EXPANDED_WIDTH}px` : `${WINDOW.OUTER_WIDTH}px`,
        borderRadius: `${WINDOW.OUTER_BORDER_RADIUS}px`,
        transitionDuration: `${ANIMATION.DURATION}ms`,
        transitionTimingFunction: ANIMATION.TIMING_FUNCTION
      }}>
      {isOffline && (
        <div className="absolute left-4 right-4 top-4 z-[900] flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#b45309] px-4 py-3 text-sm text-white shadow-lg transition-opacity duration-300">
          <div className="flex flex-col">
            <span className="font-medium">Connection lost. Reconnect to restore AI features.</span>
            {lastOnlineCheck && (
              <span className="text-xs opacity-80">
                Last online: {new Date(lastOnlineCheck).toLocaleTimeString()}
              </span>
            )}
          </div>
          <button
            onClick={handleReconnect}
            disabled={isCheckingHealth}
            className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-white transition-colors hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isCheckingHealth ? 'Reconnecting…' : 'Reconnect'}
          </button>
        </div>
      )}

      {/* Vertical line between chat and right panel */}
      {(showVisualTips || showProjectAnalysis || showAnalysingChannels || showAnalysisSummary) && (
        <div 
          className="absolute transition-all ease-out"
          style={{
            top: `${WINDOW.INNER_TOP}px`,
            left: `${WINDOW.DIVIDER_LEFT}px`,
            width: `${WINDOW.DIVIDER_WIDTH}px`,
            height: `${WINDOW.OUTER_HEIGHT - WINDOW.INNER_TOP}px`,
            transitionDuration: `${ANIMATION.DURATION}ms`,
            transitionTimingFunction: ANIMATION.TIMING_FUNCTION,
            zIndex: 25,
            backgroundColor: 'rgba(255,255,255,0.2)'
          }}
        />
      )}

      <main 
        className="absolute overflow-hidden transition-all ease-out bg-[#141414]"
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
                  onMessagesUpdate={(updatedMessages) => {
                    console.log('[FunctionalChat] FixIssuesChat updated messages, count:', updatedMessages.length);
                    setMessages(updatedMessages);
                  }}
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
              selectedLearnLevel={selectedLearnLevel}
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
                
                // Переходим к следующему шагу или запускаем AI анализ
                const currentStepData = chatSteps.find(step => step.id === currentStep);
                
                // Если текущий шаг требует AI анализа контекста
                if (currentStepData && currentStepData.useAIAnalysis) {
                  console.log('[Learn Mode → AI Analysis] Triggering AI context analysis');
                  
                  // Активируем AI диалог в Learn mode (остаёмся в Learn, но включаем AI)
                  setLearnModeAIActive(true);
                  console.log('[Learn Mode → AI Analysis] Activated AI in Learn Mode');
                  
                  // Собираем контекст Learn mode
                  const learnContext = messages
                    .filter(msg => !msg.isThinking && msg.content.trim() !== '')
                    .map(msg => ({
                      type: msg.type,
                      content: msg.content
                    }));
                  
                  // Отправляем контекст в backend для анализа
                  ChatService.analyzeLearnModeContext(learnContext)
                    .then(aiResponse => {
                      console.log('[Learn Mode → AI Analysis] Received analysis:', aiResponse.substring(0, 100) + '...');
                      // AI анализирует контекст и предлагает продолжение
                      addAIMessage(aiResponse);
                    })
                    .catch(error => {
                      console.error('[Learn Mode → AI Analysis] Error:', error);
                      addAIMessage("Let's continue building your track! What would you like to work on next?");
                    });
                  return;
                }
                
                // Обычный переход к следующему шагу
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
                      // Скролл к кнопке
                      scrollToNewMessage();
                    }, 3000); // Задержка после завершения анимации печатания
                  }, 500); // Задержка после завершения анимации печатания
                } else if (nextStep.id === 5) {
                  setShowStepContent(true);
                  // Показываем кнопку "Show visual tips" после завершения анимации
                  setTimeout(() => {
                    setShowOptions(true);
                    // Автоматически показываем "Completed. Next step" через 3 секунды
                    // даже если пользователь не нажал "Show visual tips"
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
                      // Скролл к кнопке
                      scrollToNewMessage();
                    }, 3000); // 3 секунды задержка
                  }, 500); // Задержка после завершения анимации печатания
                } else if (nextStep.id === 6) {
                  // Последний шаг Learn mode - показываем кнопку "Completed. Next step" с анимацией
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
                    // Скролл к кнопке
                    scrollToNewMessage();
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
            <div
              className={`absolute bottom-[10px] left-[10px] h-[116px] rounded-[7px] backdrop-blur-[18.5px] transition-all duration-500 ease-out ${
                showVisualTips ? 'w-[357px]' : 'w-[357px]'
              } ${userInput ? 'ring-2 ring-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : ''} bg-[#ffffff0d] border border-white/5 text-white overflow-hidden`}
              style={{
                transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}
            >
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Message..."
                className="absolute top-[10px] left-[12px] w-[calc(100%-55px)] text-white bg-transparent border-none outline-none placeholder:text-[#ffffff6b] resize-none overflow-hidden"
                style={{ 
                  fontFamily: 'var(--body-font-family)',
                  fontSize: 'var(--body-font-size)',
                  fontStyle: 'var(--body-font-style)',
                  fontWeight: 'var(--body-font-weight)',
                  letterSpacing: 'var(--body-letter-spacing)',
                  lineHeight: 'var(--body-line-height)',
                  height: '60px',
                  overflowY: 'hidden'
                }}
              />

              {userInput ? (
                <button
                  className="absolute bottom-[6px] right-[6px] w-[28px] h-[28px] flex items-center justify-center rounded-md cursor-pointer transition-all duration-300 ease-out bg-[linear-gradient(134deg,rgba(115,34,182,1)_0%,rgba(83,12,141,1)_100%),linear-gradient(0deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.08)_100%)] shadow-[0_0_12px_rgba(168,85,247,0.5)] hover:shadow-[0_0_16px_rgba(168,85,247,0.7)] hover:brightness-110 hover:scale-110"
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
                    src={SEND_ICON}
                    style={{
                      filter: 'brightness(0) invert(1)'
                    }}
                  />
                </button>
              ) : (
                <img
                  className="absolute bottom-[6px] right-[6px] w-[28px] h-[28px] cursor-pointer transition-all duration-300 ease-out hover:scale-110 opacity-80 hover:opacity-100"
                  style={{
                    transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                  }}
                  alt="Send"
                  src={SEND_ICON}
                  onClick={handleSendMessage}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(258deg) brightness(104%) contrast(97%) drop-shadow(0 0 8px rgba(168,85,247,0.6))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = '';
                  }}
                />
              )}

              <button
                onClick={handleAnalyze}
                disabled={currentStep < 5}
                className={`absolute bottom-[6px] right-[268px] flex items-center gap-1 rounded-[6px] px-[7px] py-[7px] transition-all duration-300 ease-out ${
                  currentStep < 5 
                    ? 'bg-[#21182940] border border-solid border-[#e8ceff10] text-white cursor-not-allowed opacity-50' 
                    : 'bg-[#211829] border border-solid border-[#e8ceff21] text-white hover:bg-[#2a1f35] hover:border-[#e8ceff40] cursor-pointer'
                }`}
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}
              >
                <img
                  className="w-4 h-4"
                  alt="Analysis"
                  src={ANALYSIS_ICON}
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
                aria-expanded={showLearnMode}
                className={`absolute bottom-[6px] left-[93px] flex items-center gap-1 rounded-[6px] px-[7px] py-[7px] cursor-pointer transition-all duration-300 ease-out bg-[#211829] border border-solid text-white hover:bg-[#2a1f35] hover:border-[#e8ceff40] ${
                  showLearnMode
                    ? 'border-[#e8ceff80] ring-2 ring-purple-500/40'
                    : 'border-[#e8ceff21]'
                }`}
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}
              >
                <img
                  className="w-4 h-4"
                  alt="Learn"
                  src={LEARN_ICON}
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
                  alt="Select level"
                  src={CARET_ICON}
                  style={{
                    transform: showLearnMode ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 200ms ease'
                  }}
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

      </div>


      {/* Sidebar Menu */}
      <SidebarMenu 
        isVisible={showSidebar} 
        onClose={handleSidebarClose} 
      />
    </div>
  );

  return mainContent;
};