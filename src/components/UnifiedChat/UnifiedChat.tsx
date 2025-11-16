import React, { useState, useEffect, useRef } from "react";
import { Frame } from "../Frame";
import { ChatMessage } from "../ChatMessage";
import { ChatButton } from "../ChatButton";
import { getLatestProject, getSelectedProject, setSelectedProject } from "../../services/projects";

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  avatar?: string;
  timestamp: number;
  isTyping?: boolean;
}

interface UnifiedChatProps {
  onNext: () => void;
  onBack: () => void;
}

export const UnifiedChat = ({ onNext, onBack }: UnifiedChatProps): JSX.Element => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [projectName, setProjectName] = useState("New Project");
  const [userInput, setUserInput] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [showGenres, setShowGenres] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [showReadyButton, setShowReadyButton] = useState(false);
  const [showStepContent, setShowStepContent] = useState(false);
  const [optionTexts, setOptionTexts] = useState<string[]>(["", "", ""]);
  const [genreTexts, setGenreTexts] = useState<string[]>(["", "", "", ""]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Автоматический скролл вниз
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const selectedProject = getSelectedProject();
    if (selectedProject) {
      setProjectName(selectedProject.name);
      return;
    }

    const latestProject = getLatestProject();
    if (latestProject) {
      setSelectedProject(latestProject);
      setProjectName(latestProject.name);
    }
  }, []);

  // Автоматический скролл при изменении сообщений
  useEffect(() => {
    scrollToBottom();
  }, [messages, showOptions, showGenres, showResponse, showReadyButton, showStepContent]);

  // Добавляем сообщение
  const addMessage = (type: 'ai' | 'user', content: string, avatar?: string, isTyping = false) => {
    const message: Message = {
      id: `${type}-${Date.now()}`,
      type,
      content,
      avatar,
      timestamp: Date.now(),
      isTyping
    };
    setMessages(prev => [...prev, message]);
  };

  // Обновляем последнее сообщение (для анимации печатания)
  const updateLastMessage = (content: string, isTyping = false) => {
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0) {
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          content,
          isTyping
        };
      }
      return newMessages;
    });
  };

  // Анимация печатания
  const startTypingAnimation = (text: string, onComplete?: () => void) => {
    let currentText = '';
    let index = 0;
    
    const typeNextChar = () => {
      if (index < text.length) {
        currentText += text[index];
        updateLastMessage(currentText, true);
        index++;
        setTimeout(typeNextChar, 30);
      } else {
        updateLastMessage(currentText, false);
        if (onComplete) {
          setTimeout(onComplete, 300);
        }
      }
    };
    
    typeNextChar();
  };

  // Инициализация первого сообщения (Chat1)
  useEffect(() => {
    if (messages.length === 0) {
      addMessage('ai', '', 'https://c.animaapp.com/hOiZ2IT6/img/b56f1665-0403-49d2-b00e-ec2a27378422-1@2x.png', true);
      startTypingAnimation("What you'd like to do with New Project? Select your choice or simply type in what you'd like to do.", () => {
        setCurrentStep(1);
        setShowOptions(true);
      });
    }
  }, []);

  // Анимация появления опций (Chat1)
  useEffect(() => {
    if (!showOptions) return;
    
    const optionsList = [
      "Create new song from scratch",
      "Help with current song", 
      "Create remix"
    ];
    
    optionsList.forEach((option, index) => {
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
        }, 25);
      }, index * 200);
    });
  }, [showOptions]);

  // Обработка выбора опции (Chat1 -> Chat2)
  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    addMessage('user', option);
    
    setTimeout(() => {
      setCurrentStep(2);
      addMessage('ai', '', 'https://c.animaapp.com/hOiZ2IT6/img/b56f1665-0403-49d2-b00e-ec2a27378422-1@2x.png', true);
      startTypingAnimation("Select the genre of the song or type in.", () => {
        setCurrentStep(3);
        setShowGenres(true);
      });
    }, 500);
  };

  // Анимация появления жанров (Chat2)
  useEffect(() => {
    if (!showGenres) return;
    
    const genresList = ["House", "Techno", "Trance", "Drum & Bass"];
    
    genresList.forEach((genre, index) => {
      setTimeout(() => {
        let charIndex = 0;
        const typeTimer = setInterval(() => {
          if (charIndex < genre.length) {
            setGenreTexts(prev => {
              const newTexts = [...prev];
              newTexts[index] = genre.slice(0, charIndex + 1);
              return newTexts;
            });
            charIndex++;
          } else {
            clearInterval(typeTimer);
          }
        }, 25);
      }, index * 200);
    });
  }, [showGenres]);

  // Обработка выбора жанра (Chat2 -> Chat3)
  const handleGenreClick = (genre: string) => {
    setSelectedGenre(genre);
    addMessage('user', genre);
    
    setTimeout(() => {
      setCurrentStep(4);
      addMessage('ai', '', 'https://c.animaapp.com/hOiZ2IT6/img/b56f1665-0403-49d2-b00e-ec2a27378422-1@2x.png', true);
      startTypingAnimation("Creating the plan for House creation process...", () => {
        setCurrentStep(5);
        setTimeout(() => {
          onNext(); // Переход к Chat4
        }, 1000);
      });
    }, 500);
  };

  // Обработка кнопки "I'm ready!" (Chat4)
  const handleReadyClick = () => {
    addMessage('user', "I'm ready! Let's start!");
    
    setTimeout(() => {
      setCurrentStep(6);
      addMessage('ai', '', 'https://c.animaapp.com/hOiZ2IT6/img/b56f1665-0403-49d2-b00e-ec2a27378422-1@2x.png', true);
      startTypingAnimation("Perfect, let's create a track in the House style.\n\nTo make things simple, we'll break the process down into clear steps:\n\nSet up the project (tempo, time signature, basic settings).\nBuild the rhythm (kick, hi-hats, clap).\nCreate the bassline.\nAdd chords and pads.\nLayer melodic elements and leads.\nEnhance with effects and transitions.\nBalance levels and shape the full track structure.\n\n💡 At any point, you can ask questions or request extra guidance — I'll provide more details so you fully understand the process.\n\nAre you ready to start with Step 1 — Project Setup?", () => {
        setCurrentStep(7);
        setShowStepContent(true);
        setTimeout(() => {
          addMessage('ai', '', 'https://c.animaapp.com/hOiZ2IT6/img/b56f1665-0403-49d2-b00e-ec2a27378422-1@2x.png', true);
          startTypingAnimation("🟢 Step 1 of 7 — Project Setup\n\nIn House music, the foundation is usually a tempo of 120–125 BPM and a 4/4 time signature.\n\nWhy?\n\nTempo (124 BPM): This speed feels energetic but still groovy — perfect for dancing.\n\nTime Signature (4/4): Almost every House track uses this because it creates the steady, driving pulse you hear in clubs.\n\nLet's set your project to:\n\nTempo: 124 BPM\nTime Signature: 4/4\n\nOn the right, you'll see a visual guide highlighting where to adjust these settings in Ableton.\n\nWhen you're ready, type \"done\" and we'll move on to Step 2 — Rhythm. 🎵", () => {
            setCurrentStep(8);
            setShowReadyButton(true);
          });
        }, 1000);
      });
    }, 500);
  };

  // Обработка отправки сообщения
  const handleSendMessage = () => {
    if (userInput.trim()) {
      addMessage('user', userInput);
      setUserInput("");
      onNext();
    }
  };

  // Обработка нажатия клавиши
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleAnalyze = () => {
    if (import.meta.env.DEV) {
      console.debug('[unifiedChat] analyze clicked');
    }
  };

  const handleLearn = () => {
    if (import.meta.env.DEV) {
      console.debug('[unifiedChat] learn clicked');
    }
  };

  return (
    <div className="relative w-[383px] h-[847px] bg-[#413f42] rounded-[10px] overflow-hidden">
      {/* Header */}
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
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.content}
              isTyping={message.isTyping}
              isUser={message.type === 'user'}
              avatar={message.avatar}
            />
          ))}

          {/* Опции выбора (Chat1) */}
          {showOptions && (
            <div className="flex flex-col gap-3 items-end mb-3">
              {["Create new song from scratch", "Help with current song", "Create remix"].map((option, index) => {
                const hasText = optionTexts[index] && optionTexts[index].length > 0;
                const isTyping = hasText && optionTexts[index].length < option.length;
                const shouldShow = hasText || index === 0;
                
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

          {/* Опции жанров (Chat2) */}
          {showGenres && (
            <div className="flex flex-col gap-3 items-end mb-3">
              {["House", "Techno", "Trance", "Drum & Bass"].map((genre, index) => {
                const hasText = genreTexts[index] && genreTexts[index].length > 0;
                const isTyping = hasText && genreTexts[index].length < genre.length;
                const shouldShow = hasText || index === 0;
                
                return (
                  <ChatButton
                    key={index}
                    text={hasText ? genreTexts[index] : ''}
                    onClick={() => handleGenreClick(genre)}
                    variant="option"
                    isVisible={shouldShow}
                    isTyping={!!isTyping}
                  />
                );
              })}
            </div>
          )}

          {/* Кнопка "I'm ready!" (Chat4) */}
          {showReadyButton && (
            <div className="flex justify-end mb-3">
              <ChatButton
                text="I'm ready! Let's start!"
                onClick={handleReadyClick}
                variant="primary"
              />
            </div>
          )}

          {/* Кнопка "Show visual tips" (Chat5) */}
          {showStepContent && (
            <div className="flex justify-start mb-3">
              <ChatButton
                text="Show visual tips"
                onClick={() => setCurrentStep(8)}
                variant="secondary"
                className="w-[298px]"
              />
            </div>
          )}

          {/* "Completed. Next step." (Chat5) */}
          {currentStep === 8 && (
            <div className="flex justify-end mb-3">
              <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-[10px] border border-solid border-[#ffffff21]">
                <div className="font-body font-[number:var(--body-font-weight)] text-white text-[13px] text-right tracking-[0] leading-[22px] whitespace-nowrap">
                  Completed. Next step.
                </div>
              </div>
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
