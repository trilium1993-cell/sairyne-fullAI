import React, { useState, useEffect } from "react";
import { Frame } from "../../components/Frame";
import { ChatMessage } from "../../components/ChatMessage";
import { ChatButton } from "../../components/ChatButton";
import { useTypingAnimation } from "../../hooks/useTypingAnimation";
import "./chat2.css";

interface Chat2Props {
  onNext: () => void;
  onBack: () => void;
}

export const Chat2 = ({ onNext }: Chat2Props): JSX.Element => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [showGenres, setShowGenres] = useState(false);
  const [genreTexts, setGenreTexts] = useState<string[]>(["", "", "", ""]);
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

  const fullText = "Select the genre of the song or type in.";
  const genres = ["House", "Techno", "Trance", "Drum & Bass"];

  // Эффект печатания основного текста
  useEffect(() => {
    if (isTyping && displayedText.length < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 30); // Более быстрая скорость печатания для плавности
      return () => clearTimeout(timer);
    } else if (displayedText.length === fullText.length) {
      setIsTyping(false);
      // Показываем жанры после завершения основного текста
      setTimeout(() => {
        setShowGenres(true);
      }, 300); // Уменьшенная задержка для более быстрого перехода
    }
  }, [displayedText, isTyping, fullText]);

  // Анимация появления жанров
  useEffect(() => {
    if (!showGenres) return;
    
    console.log('Starting genre animation...');
    
    // Плавная анимация - показываем жанры поочередно с печатанием текста
    const genresList = ["House", "Techno", "Trance", "Drum & Bass"];
    
    genresList.forEach((genre, index) => {
      // Задержка перед началом каждого жанра
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
        }, 25); // Быстрая скорость печатания для плавности
      }, index * 200); // Небольшая задержка между жанрами
    });
  }, [showGenres]);

  const handleGenreClick = (genre: string) => {
    setSelectedGenre(genre);
    setMessage(genre);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (e.target.value !== selectedGenre) {
      setSelectedGenre("");
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      // Очищаем поле ввода
      setMessage("");
      setSelectedGenre("");
      // После отправки сообщения переходим к следующему экрану
      onNext();
    }
  };

  const handleAnalyze = () => {
    // Заглушка для будущего функционала
  };

  const handleLearn = () => {
    // Заглушка для будущего функционала
  };


  return (
    <div
      className="relative w-[383px] h-[847px] bg-[#413f42] rounded-[10px] overflow-hidden"
      data-model-id="337:2152"
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

        {/* Chat Messages */}
        <div className="absolute top-[95px] left-[10px] right-[10px] bottom-[140px] overflow-y-auto">
          {/* System message - left aligned */}
          <div className="flex justify-start mb-3">
            <div className="inline-block max-w-[347px] bg-[#ffffff08] rounded-[10px] border border-solid border-[#ffffff0a] p-2">
              <div className="flex gap-2">
                <div className="w-[30px] h-[30px] flex-shrink-0 flex bg-[#141414] rounded-[17.75px] overflow-hidden border-[0.78px] border-solid border-[#ffffff1f]">
                  <img
                    className="mt-[3.1px] w-[21.78px] h-[21.78px] ml-[3.1px] aspect-[1]"
                    alt="Sairyne avatar"
                    src="https://c.animaapp.com/C5wtAyNJ/img/b56f1665-0403-49d2-b00e-ec2a27378422-1-1@2x.png"
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
              <p className="[font-family:'DM_Sans',Helvetica] font-normal text-white text-sm tracking-[0] leading-[22px] whitespace-nowrap">
                Create new song from scratch
              </p>
            </div>
          </div>

          {/* System message with typing effect - left aligned */}
          <div className="flex justify-start mb-3">
            <div className="max-w-[291px] flex items-center gap-2 px-2 py-2 bg-[#ffffff08] rounded-[10px] border border-solid border-[#ffffff0a]">
              <div className="w-[30px] h-[30px] flex-shrink-0 flex bg-[#141414] rounded-[17.75px] overflow-hidden border-[0.78px] border-solid border-[#ffffff1f]">
                <img
                  className="mt-[3.1px] w-[21.78px] h-[21.78px] ml-[3.1px] aspect-[1]"
                  alt="Sairyne avatar"
                  src="https://c.animaapp.com/C5wtAyNJ/img/b56f1665-0403-49d2-b00e-ec2a27378422-1-1@2x.png"
                />
              </div>

              <p className="flex-1 font-body font-[number:var(--body-font-weight)] text-[#ffffff99] text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)]">
                {displayedText}
                {isTyping && <span className="animate-pulse">|</span>}
              </p>
            </div>
          </div>

          {/* Genre options - right aligned */}
          {showGenres && (
            <div className="flex flex-col items-end gap-3">
              {genres.map((genre, index) => {
                const hasText = genreTexts[index] && genreTexts[index].length > 0;
                const isTyping = hasText && genreTexts[index].length < genre.length;
                const shouldShow = hasText || index === 0; // Показываем первый жанр сразу, остальные по мере появления текста
                
                return (
                  <button
                    key={index}
                    onClick={() => handleGenreClick(genre)}
                    className={`inline-flex items-center justify-center px-3 py-1.5 rounded-[10px] border border-solid transition-all w-fit font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)] ${
                      selectedGenre === genre 
                        ? 'bg-[#7221b6] border-[#7221b6]' 
                        : 'bg-[#ffffff08] border-[#ffffff21] hover:border-[#7221b6] hover:bg-[#ffffff0f]'
                    } ${shouldShow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                  >
                    {hasText ? genreTexts[index] : ''}
                    {isTyping && <span className="animate-pulse">|</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Message Input Frame */}
        <div className={`absolute bottom-4 left-[calc(50.00%_-_178px)] w-[357px] h-[116px] bg-[#ffffff0d] rounded-[7px] backdrop-blur-[18.5px] transition-all duration-300 ${
          message ? 'ring-2 ring-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : ''
        }`}>
          <input
            type="text"
            value={message}
            onChange={handleMessageChange}
            placeholder="Message..."
            className="absolute top-2.5 left-3 font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] whitespace-nowrap [font-style:var(--body-font-style)] bg-transparent border-none outline-none placeholder:text-[#ffffff6b]"
            style={{ width: 'calc(100% - 100px)' }}
          />

          {message ? (
            <button
              className="absolute right-1.5 bottom-1.5 w-7 h-7 flex items-center justify-center rounded-md cursor-pointer transition-all duration-300 ease-out bg-[linear-gradient(134deg,rgba(115,34,182,1)_0%,rgba(83,12,141,1)_100%),linear-gradient(0deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.08)_100%)] shadow-[0_0_12px_rgba(168,85,247,0.5)] hover:shadow-[0_0_16px_rgba(168,85,247,0.7)] hover:brightness-110"
              style={{
                transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}
              type="button"
              aria-label="Send message"
              onClick={handleSendMessage}
            >
              <img
                className="w-7 h-7"
                alt="Send"
                src="https://c.animaapp.com/C5wtAyNJ/img/frame-13-1.svg"
                style={{
                  filter: 'brightness(0) invert(1)'
                }}
              />
            </button>
          ) : (
            <img
              className="absolute right-1.5 bottom-1.5 w-7 h-7 cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:opacity-80"
              style={{
                transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}
              alt="Send"
              src="https://c.animaapp.com/C5wtAyNJ/img/frame-13-1.svg"
              onClick={handleSendMessage}
            />
          )}

          <button
            onClick={handleAnalyze}
            className="inline-flex h-7 items-center justify-center gap-1 pl-[7px] pr-2.5 py-[7px] absolute right-[268px] bottom-1.5 bg-[#211829] rounded-md border-[0.5px] border-solid border-[#e8ceff21] cursor-pointer"
          >
            <img
              className="relative w-4 h-4 mt-[-1.00px] mb-[-1.00px]"
              alt="Analysis"
              src="https://c.animaapp.com/C5wtAyNJ/img/waveform-light-1-1.svg"
            />
            <div className="relative w-fit mt-[-2.50px] mb-[-1.50px] font-helper font-[number:var(--helper-font-weight)] text-white text-[length:var(--helper-font-size)] tracking-[var(--helper-letter-spacing)] leading-[var(--helper-line-height)] whitespace-nowrap [font-style:var(--helper-font-style)]">
              Analysis
            </div>
          </button>

          <button
            onClick={handleLearn}
            className="inline-flex h-7 items-center justify-center gap-1 pl-[7px] pr-2.5 py-[7px] absolute left-[93px] bottom-1.5 bg-[#211829] rounded-md border-[0.5px] border-solid border-[#e8ceff21] cursor-pointer"
          >
            <img
              className="relative w-4 h-4 mt-[-1.00px] mb-[-1.00px]"
              alt="Learn"
              src="https://c.animaapp.com/C5wtAyNJ/img/stack-1-1.svg"
            />
            <div className="relative w-fit mt-[-2.50px] mb-[-1.50px] font-helper font-[number:var(--helper-font-weight)] text-white text-[length:var(--helper-font-size)] tracking-[var(--helper-letter-spacing)] leading-[var(--helper-line-height)] whitespace-nowrap [font-style:var(--helper-font-style)]">
              Learn
            </div>
            <img
              className="relative w-[6.93px] h-[4.5px]"
              alt="Polygon"
              src="https://c.animaapp.com/C5wtAyNJ/img/polygon-1-3.svg"
            />
          </button>
        </div>
      </main>
    </div>
  );
};
