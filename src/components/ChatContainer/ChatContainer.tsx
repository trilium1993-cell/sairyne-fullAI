import React, { useState, useEffect, useRef } from "react";
import { Frame } from "../Frame";
import { getLatestProject, getSelectedProject, setSelectedProject } from "../../services/projects";

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: number;
  isVisible: boolean;
  isTyping: boolean;
}

interface ChatContainerProps {
  onNext: () => void;
  onBack: () => void;
}

export const ChatContainer = ({ onNext, onBack }: ChatContainerProps): JSX.Element => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [projectName, setProjectName] = useState("New Project");
  const [userInput, setUserInput] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Полная последовательность сообщений из всех чатов
  const allMessages = [
    // Chat1
    {
      type: 'ai' as const,
      content: "What you'd like to do with New Project? Select your choice or simply type in what you'd like to do."
    },
    {
      type: 'user' as const,
      content: "Create new song from scratch"
    },
    // Chat2
    {
      type: 'ai' as const,
      content: "Select the genre of the song or type in."
    },
    {
      type: 'user' as const,
      content: "House"
    },
    // Chat3
    {
      type: 'ai' as const,
      content: "Creating the plan for House creation process..."
    },
    // Chat4
    {
      type: 'ai' as const,
      content: "Perfect, let's create a track in the House style.\n\nTo make things simple, we'll break the process down into clear steps:\n\nSet up the project (tempo, time signature, basic settings).\nBuild the rhythm (kick, hi-hats, clap).\nCreate the bassline.\nAdd chords and pads.\nLayer melodic elements and leads.\nEnhance with effects and transitions.\nBalance levels and shape the full track structure.\n\n💡 At any point, you can ask questions or request extra guidance — I'll provide more details so you fully understand the process.\n\nAre you ready to start with Step 1 — Project Setup?"
    },
    {
      type: 'user' as const,
      content: "I'm ready! Let's start!"
    },
    // Chat5
    {
      type: 'ai' as const,
      content: "🟢 Step 1 of 7 — Project Setup\n\nIn House music, the foundation is usually a tempo of 120–125 BPM and a 4/4 time signature.\n\nWhy?\n\nTempo (124 BPM): This speed feels energetic but still groovy — perfect for dancing.\n\nTime Signature (4/4): Almost every House track uses this because it creates the steady, driving pulse you hear in clubs.\n\nLet's set your project to:\n\nTempo: 124 BPM\nTime Signature: 4/4\n\nOn the right, you'll see a visual guide highlighting where to adjust these settings in Ableton.\n\nWhen you're ready, type \"done\" and we'll move on to Step 2 — Rhythm. 🎵"
    }
  ];

  // Получаем название проекта из localStorage
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

  // Автоматический скролл вниз
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Инициализация сообщений
  useEffect(() => {
    const initialMessages = allMessages.map((msg, index) => ({
      id: `msg-${index}`,
      type: msg.type,
      content: msg.content,
      timestamp: Date.now() + index * 1000,
      isVisible: false,
      isTyping: false
    }));
    setMessages(initialMessages);
  }, []);

  // Последовательное отображение сообщений
  useEffect(() => {
    if (currentMessageIndex < messages.length) {
      const timer = setTimeout(() => {
        setMessages(prev => prev.map((msg, index) => {
          if (index === currentMessageIndex) {
            return { ...msg, isVisible: true, isTyping: true };
          }
          return msg;
        }));

        // Завершаем печатание через 1.2 секунды
        setTimeout(() => {
          setMessages(prev => prev.map((msg, index) => {
            if (index === currentMessageIndex) {
              return { ...msg, isTyping: false };
            }
            return msg;
          }));
          setCurrentMessageIndex(prev => prev + 1);
        }, 1200);
      }, currentMessageIndex === 0 ? 500 : 1200);

      return () => clearTimeout(timer);
    }
  }, [currentMessageIndex, messages.length]);

  // Автоскролл при изменении сообщений
  useEffect(() => {
    scrollToBottom();
  }, [messages, currentMessageIndex]);

  const handleSendMessage = () => {
    if (userInput.trim()) {
      if (import.meta.env.DEV) {
        console.debug('[chatContainer] send', userInput);
      }
      setUserInput("");
      onNext();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleAnalyze = () => {
    if (import.meta.env.DEV) {
      console.debug('[chatContainer] analyze');
    }
  };

  const handleLearn = () => {
    if (import.meta.env.DEV) {
      console.debug('[chatContainer] learn');
    }
  };

  return (
    <div className="relative w-[383px] h-[847px] bg-[#413f42] rounded-[10px] overflow-hidden">
      {/* Header */}
      <header className="absolute top-[calc(50.00%_-_416px)] left-0 right-0 h-[10px] bg-[#14141447]">
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
                message.isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4'
              } ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[347px] rounded-[10px] border border-solid p-3 transition-all duration-300 ${
                message.type === 'user'
                  ? 'bg-[#7221b6] border-[#7221b6] text-white'
                  : 'bg-[#ffffff08] border-[#ffffff0a] text-white'
              }`}>
                {message.type === 'ai' && (
                  <div className="flex items-start gap-2 mb-2">
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
                    {message.isTyping && <span className="animate-pulse ml-1">|</span>}
                  </p>
                )}
              </div>
            </div>
          ))}
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
