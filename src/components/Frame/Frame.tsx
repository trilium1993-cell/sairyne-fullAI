import { useState, useRef, CSSProperties } from "react";
import { BackToProjectsConfirmation } from "../BackToProjectsConfirmation";
import { UserMenu } from "../UserMenu";

interface FrameProps {
  projectName?: string;
  currentStep?: number;
  totalSteps?: number;
  completedSteps?: number;
  onBackToProjects?: () => void;
}

const HorizontalRule = ({ className = "", style }: { className?: string; style?: CSSProperties }) => (
  <div
    className={`bg-white/10 ${className}`}
    style={style}
    role="separator"
    aria-hidden="true"
  />
);

const CheckCircleIcon = ({ className = "", style }: { className?: string; style?: CSSProperties }) => (
  <svg
    viewBox="0 0 20 20"
    className={className}
    style={style}
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="10" cy="10" r="9" fill="#5cba4f" opacity="0.15" />
    <path
      d="M8.699 12.9a1 1 0 0 1-1.414 0l-1.697-1.697a1 1 0 1 1 1.414-1.414l0.99.99 3.615-3.614a1 1 0 0 1 1.414 1.414l-4.322 4.321Z"
      fill="#5cba4f"
    />
  </svg>
);

const CaretIcon = ({ className = "", style }: { className?: string; style?: CSSProperties }) => (
  <svg
    viewBox="0 0 12 8"
    className={className}
    style={style}
    fill="currentColor"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M10.59 1.59 6 6.17 1.41 1.59 0 3l6 6 6-6-1.41-1.41Z" />
  </svg>
);

const ListCheckIcon = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 20 20"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polyline points="5 5 7 7 11 3" />
    <line x1="13" y1="5" x2="17" y2="5" />
    <polyline points="5 11 7 13 11 9" />
    <line x1="13" y1="11" x2="17" y2="11" />
    <polyline points="5 17 7 19 11 15" />
    <line x1="13" y1="17" x2="17" y2="17" />
  </svg>
);

const UserBadgeIcon = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 28 28"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="14" cy="14" r="13" fill="#1f2026" />
    <circle cx="14" cy="11" r="4" fill="none" stroke="#d8d8dc" strokeWidth="1.4" />
    <path
      d="M8.8 21.2c0.9-2.4 3.2-4.1 5.2-4.1s4.3 1.7 5.2 4.1"
      stroke="#d8d8dc"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <circle cx="14" cy="14" r="13" fill="none" stroke="#ffffff14" strokeWidth="1" />
  </svg>
);

export const Frame = ({ projectName = "New project", currentStep = 1, totalSteps = 7, completedSteps = 0, onBackToProjects }: FrameProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const [isStepsDropdownOpen, setIsStepsDropdownOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [leftArrowHover, setLeftArrowHover] = useState(false);
  const [rightArrowHover, setRightArrowHover] = useState(false);
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const stepsDropdownRef = useRef<HTMLDivElement>(null);

  // Функция для плавного закрытия выпадающего окна
  const handleCloseDropdown = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsStepsDropdownOpen(false);
      setIsClosing(false);
    }, 500); // Время анимации
  };

  // Обработчик клика на левый треугольник
  const handleBackToProjectsClick = () => {
    setShowBackConfirmation(true);
  };

  // Подтверждение возврата к проектам
  const handleConfirmBackToProjects = () => {
    if (onBackToProjects) {
      onBackToProjects();
    }
  };

  // Шаги из Chat5.1
  const steps = [
    { id: 1, label: "Set up the project", completed: completedSteps >= 1 },
    { id: 2, label: "Build the rhythm", completed: completedSteps >= 2 },
    { id: 3, label: "Create the bassline", completed: completedSteps >= 3 },
    { id: 4, label: "Add chords and pads.", completed: completedSteps >= 4 },
    { id: 5, label: "Layer melodic elements and leads.", completed: completedSteps >= 5 },
    { id: 6, label: "Enhance with effects and transitions.", completed: completedSteps >= 6 },
    { id: 7, label: "Balance levels and shape the full track structure.", completed: completedSteps >= 7 },
  ];


  return (
    <div className="w-full flex flex-col items-center relative">
      {/* Progress Panel - абсолютно позиционированное выпадающее окно */}
      {isStepsDropdownOpen && (
        <div 
          ref={stepsDropdownRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '377px',
            minHeight: '100vh',
            backgroundColor: '#000000',
            opacity: 1,
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            zIndex: 100,
            animation: isClosing ? 'slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'slideDown 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Простой черный фон - покрывает всю высоту экрана */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            backgroundColor: 'black',
            zIndex: 0
          }} />
              {/* Header - Progress window */}
              <header className="relative z-10">
                <h1 className="absolute top-2.5 left-3 [font-family:'DM_Sans',Helvetica] font-medium text-white text-[13px] tracking-[0] leading-[normal]">
                  Progress window
                </h1>

                <HorizontalRule
                  className="absolute w-[377px]"
                  style={{ top: '39px', left: 'calc(50% - 188px)', height: '1px' }}
                />
              </header>

              {/* Content - точно как в Chat5.1 */}
              <section
                className="relative z-10"
                aria-label="Project description and progress"
              >
                <p className="absolute top-[51px] left-3 w-[308px] font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)]">
                  Create new song from scratch
                </p>

                <div
                  className="absolute top-[84px] left-3 w-[286px] h-1 bg-[#ffffff21] rounded-[30px]"
                  role="progressbar"
                  aria-valuenow={Math.round((completedSteps / totalSteps) * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Overall project progress"
                >
                  <div 
                    className="absolute top-0 left-0 h-1 bg-[#5cba4f] rounded-[30px]" 
                    style={{ width: `${(completedSteps / totalSteps) * 286}px` }}
                  />
                </div>

                <p className="absolute top-[76px] left-[305px] font-helper font-[number:var(--helper-font-weight)] text-transparent leading-[var(--helper-line-height)] whitespace-nowrap text-[length:var(--helper-font-size)] tracking-[var(--helper-letter-spacing)] [font-style:var(--helper-font-style)]">
                  <span className="text-[#ffffff6e] font-helper [font-style:var(--helper-font-style)] font-[number:var(--helper-font-weight)] tracking-[var(--helper-letter-spacing)] leading-[var(--helper-line-height)] text-[length:var(--helper-font-size)]">
                    {Math.round((completedSteps / totalSteps) * 100)}% /{" "}
                  </span>
                  <span className="text-white font-helper [font-style:var(--helper-font-style)] font-[number:var(--helper-font-weight)] tracking-[var(--helper-letter-spacing)] leading-[var(--helper-line-height)] text-[length:var(--helper-font-size)]">
                    100%
                  </span>
                </p>

                <HorizontalRule
                  className="absolute w-[calc(100%_-_26px)]"
                  style={{ top: '105px', left: '12px', height: '1px' }}
                />
              </section>

              {/* Steps List - точно как в Chat5.1 с уменьшенными отступами */}
              <section className="relative z-10" aria-label="Project steps">
                <div className="top-[119px] left-3 font-[number:var(--body-font-weight)] text-[length:var(--body-font-size)] leading-[var(--body-line-height)] whitespace-nowrap absolute font-body text-white tracking-[var(--body-letter-spacing)] [font-style:var(--body-font-style)]">
                  Steps
                </div>

                <div className="absolute top-[121px] left-[54px] [font-family:'Inter',Helvetica] font-normal text-[#888888] leading-[normal] text-xs tracking-[0]">
                  {completedSteps}/{totalSteps}
                </div>

                <ol className="relative" role="list">
                  {steps.map((step, index) => {
                    // Уменьшенные отступы между строками
                    const topPosition = 148 + index * 32;

                    return (
                      <li key={step.id} className="relative">
                        {step.completed ? (
                          <CheckCircleIcon
                            className="absolute left-[13px]"
                            style={{ top: `${topPosition}px`, width: '18px', height: '18px' }}
                          />
                        ) : (
                          <div
                            className="absolute left-3 w-5 h-5 rounded-[60px] border border-solid border-[#e8e8e81f]"
                            style={{ top: `${topPosition}px` }}
                            aria-hidden="true"
                          >
                            <span
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 [font-family:'Inter',Helvetica] font-medium text-white text-[9px] tracking-[0] leading-none"
                            >
                              {step.id}
                            </span>
                          </div>
                        )}

                        <div
                          className="absolute left-[41px] w-[308px] font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)]"
                          style={{ top: `${topPosition}px` }}
                        >
                          {step.label}
                        </div>

                        {index < steps.length - 1 && (
                          <HorizontalRule
                            className="absolute w-[calc(100%_-_26px)]"
                            style={{ top: `${topPosition + 24}px`, left: '14px', height: '1px' }}
                          />
                        )}
                      </li>
                    );
                  })}
                </ol>
              </section>

              {/* Hide Progress Button - точно как в Chat5.1 */}
              <footer className="relative z-10">
                <button
                  className="flex w-[377px] h-8 px-3 py-1.5 top-[372px] left-0 bg-[#ffffff05] border-[0.6px] border-solid border-[#ffffff21] items-center justify-center absolute"
                  type="button"
                  aria-expanded="true"
                  aria-label="Hide progress panel"
                  onClick={handleCloseDropdown}
                >
                  <div className="relative w-[102.79px] h-5">
                    <span className="absolute top-0 left-[calc(50.00%_-_35px)] font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] whitespace-nowrap [font-style:var(--body-font-style)]">
                      Hide progress
                    </span>

                    <CaretIcon
                      className="absolute w-[9px] h-[5px] text-white"
                      style={{ top: '7px', left: 0, transform: 'rotate(180deg)', opacity: 0.7 }}
                    />
                  </div>
                </button>
              </footer>
            </div>
          )}

      <header
        className="w-[377px] h-10 bg-[#14141447] relative"
        data-model-id="337:2961"
        role="banner"
        style={{ border: 'none', boxShadow: 'none', outline: 'none' }}
      >
        <div className="absolute top-2.5 left-[13px] flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div 
              className="cursor-pointer -ml-2 p-[2px]"
              onMouseEnter={() => {
                setLeftArrowHover(true);
              }}
              onMouseLeave={() => {
                setLeftArrowHover(false);
              }}
              onClick={handleBackToProjectsClick}
            >
              <CaretIcon
                className="w-[14px] h-[8px] text-white pointer-events-none"
                style={{
                  transform: 'rotate(90deg)',
                  opacity: leftArrowHover ? 1 : 0.6
                }}
              />
            </div>
            <span
              className="font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] text-center tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)] max-w-[140px] truncate"
              title={projectName}
            >
              {projectName}
            </span>
            <div 
              className="cursor-pointer p-[2px]"
              onMouseEnter={() => {
                setRightArrowHover(true);
              }}
              onMouseLeave={() => {
                setRightArrowHover(false);
              }}
            >
              <CaretIcon
                className="w-[14px] h-[8px] text-white pointer-events-none"
                style={{
                  transform: 'rotate(0deg)',
                  opacity: rightArrowHover ? 1 : 0.6
                }}
              />
            </div>
          </div>
          
          {/* Steps indicator with icon - для Chat5 */}
          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => setIsStepsDropdownOpen(!isStepsDropdownOpen)}
              className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
              aria-label="Toggle steps dropdown"
            >
              <ListCheckIcon className="w-[15px] h-[13px] text-white" />
              <span className="[font-family:'DM_Sans',Helvetica] font-light text-white text-xs tracking-[0] leading-[normal]">
                Steps
              </span>
              <span className="[font-family:'DM_Sans',Helvetica] font-normal text-[#888888] text-xs tracking-[0] leading-[normal]">
                {completedSteps}/{totalSteps}
              </span>
            </button>
          </div>
        </div>

        <button
          className="absolute top-1.5 left-[343px] w-[26px] h-[26px] cursor-pointer hover:opacity-80 transition-opacity"
          aria-label="User profile"
          type="button"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <UserBadgeIcon className="h-full w-full" />
        </button>
      </header>

      {/* Horizontal line under header */}
      <HorizontalRule
        className="absolute w-[377px]"
        style={{ top: '39px', left: '0', height: '1px' }}
      />

      {/* Confirmation Modal */}
      <BackToProjectsConfirmation
        isVisible={showBackConfirmation}
        onClose={() => setShowBackConfirmation(false)}
        onConfirm={handleConfirmBackToProjects}
      />

      {/* User Menu */}
      <UserMenu
        isOpen={showUserMenu}
        onClose={() => setShowUserMenu(false)}
      />
    </div>
  );
};
