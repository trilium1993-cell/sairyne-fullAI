import React, { useState, useEffect } from "react";
import { Frame } from "../../components/Frame";
import { ChatMessage } from "../../components/ChatMessage";
import { ChatButton } from "../../components/ChatButton";
import { useTypingAnimation } from "../../hooks/useTypingAnimation";
import { getLatestProject, getSelectedProject, setSelectedProject } from "../../services/projects";

interface Chat3Props {
  onNext: () => void;
  onBack: () => void;
}

export const Chat3 = ({ onNext }: Chat3Props): JSX.Element => {
  const [message, setMessage] = useState("");
  const [showLoading, setShowLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [projectName, setProjectName] = useState("New Project");

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

  const fullText = "Creating the plan for House creation process...";

  // Эффект печатания текста загрузки
  useEffect(() => {
    if (showLoading && loadingText.length < fullText.length) {
      const timer = setTimeout(() => {
        setLoadingText(fullText.slice(0, loadingText.length + 1));
      }, 50);
      return () => clearTimeout(timer);
    } else if (showLoading && loadingText.length === fullText.length) {
      // После завершения загрузки переходим к следующему экрану
      setTimeout(() => {
        onNext();
      }, 1000);
    }
  }, [showLoading, loadingText, fullText, onNext]);

  // Запускаем анимацию загрузки при монтировании компонента
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = () => {
    if (message.trim()) {
      if (import.meta.env.DEV) {
        console.debug('[chat3] send', message);
      }
      setMessage("");
      onNext();
    }
  };

  const handleAnalyze = () => {
    if (import.meta.env.DEV) {
      console.debug('[chat3] analyze');
    }
  };

  const handleLearn = () => {
    if (import.meta.env.DEV) {
      console.debug('[chat3] learn');
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div
      className="relative w-[383px] h-[847px] bg-[#413f42] rounded-[10px] overflow-hidden"
      data-model-id="337:2029"
    >
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
        <div className="absolute top-[95px] left-[10px] right-[10px] bottom-[140px] overflow-y-auto">
          {/* System message - left aligned */}
          <div className="flex justify-start mb-3">
            <div className="inline-block max-w-[347px] bg-[#ffffff08] rounded-[10px] border border-solid border-[#ffffff0a] p-2">
              <div className="flex gap-2">
                <div className="w-[30px] h-[30px] flex-shrink-0 flex bg-[#141414] rounded-[17.75px] overflow-hidden border-[0.78px] border-solid border-[#ffffff1f]">
                  <img
                    className="mt-[3.1px] w-[21.78px] h-[21.78px] ml-[3.1px] aspect-[1]"
                    alt="Sairyne avatar"
                    src="https://c.animaapp.com/9vAmudQ7/img/b56f1665-0403-49d2-b00e-ec2a27378422-1-2@2x.png"
                  />
                </div>

                <div className="flex-1">
                  <p className="font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)] mb-1">
                    What you'd like to do with New Project?
                  </p>

                  <p className="font-body font-[number:var(--body-font-weight)] text-[#ffffff99] text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)]">
                    Select your choice or simply type in what you'd like to do.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* User message - right aligned */}
          <div className="flex justify-end mb-3">
            <div className="inline-flex items-center justify-center px-3 py-1.5 bg-[#7221b6] rounded-[10px] border border-solid border-[#ffffff21]">
              <p className="font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] whitespace-nowrap [font-style:var(--body-font-style)]">
                Create new song from scratch
              </p>
            </div>
          </div>

          {/* System message - left aligned */}
          <div className="flex justify-start mb-3">
            <div className="max-w-[291px] flex items-center gap-2 px-2 py-2 bg-[#ffffff08] rounded-[10px] border border-solid border-[#ffffff0a]">
              <div className="w-[30px] h-[30px] flex-shrink-0 flex bg-[#141414] rounded-[17.75px] overflow-hidden border-[0.78px] border-solid border-[#ffffff1f]">
                <img
                  className="mt-[3.1px] w-[21.78px] h-[21.78px] ml-[3.1px] aspect-[1]"
                  alt="Sairyne avatar"
                  src="https://c.animaapp.com/9vAmudQ7/img/b56f1665-0403-49d2-b00e-ec2a27378422-1-2@2x.png"
                />
              </div>

              <p className="flex-1 font-body font-[number:var(--body-font-weight)] text-[#ffffff99] text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)]">
                Select the genre of the song or type in.
              </p>
            </div>
          </div>

          {/* User message - right aligned */}
          <div className="flex justify-end mb-3">
            <div className="inline-flex items-center justify-center px-3 py-1.5 bg-[#7221b6] rounded-[10px] border border-solid border-[#ffffff21]">
              <p className="font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] whitespace-nowrap [font-style:var(--body-font-style)]">
                House
              </p>
            </div>
          </div>

          {/* Loading message */}
          {showLoading && (
            <div className="flex justify-start mb-3">
              <div className="inline-block max-w-[347px] bg-[#ffffff08] rounded-[10px] border border-solid border-[#ffffff0a] p-2">
                <div className="flex gap-2">
                  <div className="w-[30px] h-[30px] flex-shrink-0 flex bg-[#141414] rounded-[17.75px] overflow-hidden border-[0.78px] border-solid border-[#ffffff1f]">
                    <img
                      className="mt-[3.1px] w-[21.78px] h-[21.78px] ml-[3.1px] aspect-[1]"
                      alt="Sairyne avatar"
                      src="https://c.animaapp.com/9vAmudQ7/img/b56f1665-0403-49d2-b00e-ec2a27378422-1-2@2x.png"
                    />
                  </div>

                  <div className="flex-1">
                    <p className="font-body font-[number:var(--body-font-weight)] text-[#ffffff80] text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)]">
                      {loadingText}
                      {loadingText.length < fullText.length && <span className="animate-pulse">|</span>}
                    </p>
                  </div>
                </div>
              </div>
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
                src="https://c.animaapp.com/9vAmudQ7/img/frame-13-1.svg"
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
              src="https://c.animaapp.com/9vAmudQ7/img/frame-13-1.svg"
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
              src="https://c.animaapp.com/9vAmudQ7/img/waveform-light-1-1.svg"
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
              src="https://c.animaapp.com/9vAmudQ7/img/stack-1-1.svg"
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
              src="https://c.animaapp.com/9vAmudQ7/img/polygon-1-3.svg"
            />
          </button>
        </div>
      </main>
    </div>
  );
};
