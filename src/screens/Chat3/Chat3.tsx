import React, { useState, useEffect } from "react";
import { Frame } from "../../components/Frame";
import { ChatMessage } from "../../components/ChatMessage";
import { ChatButton } from "../../components/ChatButton";
import { useTypingAnimation } from "../../hooks/useTypingAnimation";

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
    // Сначала проверяем выбранный проект
    const selectedProjectData = localStorage.getItem('sairyne_selected_project');
    if (selectedProjectData) {
      const selectedProject = JSON.parse(selectedProjectData);
      setProjectName(selectedProject.name);
    } else {
      // Если нет выбранного, берем последний созданный
      const savedProjects = JSON.parse(localStorage.getItem('sairyne_projects') || '[]');
      if (savedProjects.length > 0) {
        const lastProject = savedProjects[savedProjects.length - 1];
        setProjectName(lastProject.name);
      }
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
      console.log("Sending message:", message);
      setMessage("");
      onNext();
    }
  };

  const handleAnalyze = () => {
    console.log("Analyze clicked");
  };

  const handleLearn = () => {
    console.log("Learn clicked");
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
      <header className="absolute top-[calc(50.00%_-_416px)] left-0 right-0 flex items-center justify-between px-3 h-5">
        <h1 className="[font-family:'Inter',Helvetica] font-medium text-white text-[13px] text-center tracking-[0] leading-[normal]">
          Sairyne
        </h1>
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
        <div className="absolute bottom-[10px] left-[10px] w-[357px] h-[116px] bg-[#ffffff0d] rounded-[7px] backdrop-blur-[18.5px]">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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
            className="absolute bottom-[6px] right-[6px] w-[28px] h-[28px] cursor-pointer"
            alt="Send"
            src="https://c.animaapp.com/9vAmudQ7/img/frame-13-1.svg"
            onClick={handleSendMessage}
          />

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
