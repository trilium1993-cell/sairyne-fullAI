import React from "react";

interface Step {
  id: number;
  label: string;
  completed: boolean;
}

interface ProgressPanelProps {
  totalSteps?: number;
  currentStep?: number;
  completedSteps?: number;
  onHide?: () => void;
  projectName?: string;
}

export const ProgressPanel = ({ 
  totalSteps = 7, 
  currentStep = 1, 
  completedSteps = 1, 
  onHide,
  projectName = "New project"
}: ProgressPanelProps): JSX.Element => {
  const steps: Step[] = [
    { id: 1, label: "Set up the project", completed: true },
    { id: 2, label: "Build the rhythm", completed: false },
    { id: 3, label: "Create the bassline", completed: false },
    { id: 4, label: "Add chords and pads.", completed: false },
    { id: 5, label: "Layer melodic elements and leads.", completed: false },
    { id: 6, label: "Enhance with effects and transitions.", completed: false },
    {
      id: 7,
      label: "Balance levels and shape the full track structure.",
      completed: false,
    },
  ];

  const progressPercentage = 15;

  return (
    <aside
      className="absolute top-0 left-0 w-[377px] h-[442px] bg-[#ffffff05] backdrop-blur-xl backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(24px)_brightness(100%)]"
      role="complementary"
      aria-label="Project setup progress"
    >
      <header className="relative">
        <h1 className="absolute top-2.5 left-3 [font-family:'DM_Sans',Helvetica] font-medium text-white text-[13px] text-center tracking-[0] leading-[normal]">
          {projectName}
        </h1>

        <img
          className="absolute top-[17px] left-[92px] w-[9px] h-[5px]"
          alt=""
          src="https://c.animaapp.com/Pqm9zsUr/img/polygon-1.svg"
          aria-hidden="true"
        />

        <img
          className="top-[39px] left-[calc(50.00%_-_188px)] w-[377px] h-px absolute object-cover"
          alt=""
          src="https://c.animaapp.com/Pqm9zsUr/img/line-21.svg"
          aria-hidden="true"
        />

        <button
          className="absolute top-1.5 left-[343px] w-[26px] h-[26px]"
          aria-label="Close project setup"
          type="button"
          onClick={onHide}
        >
          <img
            alt=""
            src="https://c.animaapp.com/Pqm9zsUr/img/frame-16715.svg"
            aria-hidden="true"
          />
        </button>

        <div className="top-3 left-[143px] font-light text-xs leading-[normal] absolute [font-family:'DM_Sans',Helvetica] text-white tracking-[0]">
          Steps
        </div>

        <div className="absolute top-3 left-[181px] [font-family:'DM_Sans',Helvetica] font-normal text-[#888888] text-xs tracking-[0] leading-[normal]">
          {currentStep}/{totalSteps}
        </div>

        <img
          className="absolute top-[13px] left-[121px] w-[15px] h-[13px]"
          alt=""
          src="https://c.animaapp.com/Pqm9zsUr/img/list-check-1.svg"
          aria-hidden="true"
        />

        <img
          className="top-3.5 left-[110px] w-px h-3 absolute object-cover"
          alt=""
          src="https://c.animaapp.com/Pqm9zsUr/img/line-28.svg"
          aria-hidden="true"
        />
      </header>

      <section
        className="relative"
        aria-label="Project description and progress"
      >
        <p className="absolute top-[51px] left-3 w-[308px] font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)]">
          Create new song from scratch
        </p>

        <div
          className="absolute top-[84px] left-3 w-[286px] h-1 bg-[#ffffff21] rounded-[30px]"
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall project progress"
        >
          <div className="absolute top-0 left-0 w-[42px] h-1 bg-[#5cba4f] rounded-[30px]" />
        </div>

        <p className="absolute top-[76px] left-[305px] font-helper font-[number:var(--helper-font-weight)] text-transparent leading-[var(--helper-line-height)] whitespace-nowrap text-[length:var(--helper-font-size)] tracking-[var(--helper-letter-spacing)] [font-style:var(--helper-font-style)]">
          <span className="text-[#ffffff6e] font-helper [font-style:var(--helper-font-style)] font-[number:var(--helper-font-weight)] tracking-[var(--helper-letter-spacing)] leading-[var(--helper-line-height)] text-[length:var(--helper-font-size)]">
            {progressPercentage}% /{" "}
          </span>
          <span className="text-white font-helper [font-style:var(--helper-font-style)] font-[number:var(--helper-font-weight)] tracking-[var(--helper-letter-spacing)] leading-[var(--helper-line-height)] text-[length:var(--helper-font-size)]">
            100%
          </span>
        </p>

        <img
          className="w-[calc(100%_-_26px)] top-[105px] left-3 h-px absolute object-cover"
          alt=""
          src="https://c.animaapp.com/Pqm9zsUr/img/line-9.svg"
          aria-hidden="true"
        />
      </section>

      <section className="relative" aria-label="Project steps">
        <div className="top-[119px] left-3 font-[number:var(--body-font-weight)] text-[length:var(--body-font-size)] leading-[var(--body-line-height)] whitespace-nowrap absolute font-body text-white tracking-[var(--body-letter-spacing)] [font-style:var(--body-font-style)]">
          Steps
        </div>

        <div className="absolute top-[121px] left-[54px] [font-family:'Inter',Helvetica] font-normal text-[#888888] leading-[normal] text-xs tracking-[0]">
          {currentStep}/{totalSteps}
        </div>

        <ol className="relative" role="list">
          {steps.map((step, index) => {
            const topPosition = 148 + index * 37;

            return (
              <li key={step.id} className="relative">
                {step.completed ? (
                  <img
                    className="absolute left-[13px] w-[18px] h-[18px]"
                    style={{ top: `${topPosition}px` }}
                    alt=""
                    src="https://c.animaapp.com/Pqm9zsUr/img/check-circle-fill-4.svg"
                    aria-hidden="true"
                  />
                ) : (
                  <div
                    className="absolute left-3 w-5 h-5 flex items-center justify-center rounded-[60px] overflow-hidden border border-solid border-[#e8e8e81f]"
                    style={{ top: `${topPosition}px` }}
                    aria-hidden="true"
                  >
                    <div
                      className={`${step.id === 3 ? "ml-[-3px]" : "-ml-0.5"} -mt-0.5 h-[18px] w-1.5 [font-family:'Inter',Helvetica] font-medium text-white text-[9px] text-center tracking-[0] leading-[18px] whitespace-nowrap`}
                    >
                      {step.id}
                    </div>
                  </div>
                )}

                <div
                  className="absolute left-[41px] w-[308px] font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)]"
                  style={{ top: `${topPosition}px` }}
                >
                  {step.label}
                </div>

                {index < steps.length - 1 && (
                  <img
                    className="w-[calc(100%_-_26px)] left-3.5 h-px absolute object-cover"
                    style={{ top: `${topPosition + 29}px` }}
                    alt=""
                    src="https://c.animaapp.com/Pqm9zsUr/img/line-14.svg"
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <footer>
        <button
          className="flex w-[377px] h-8 px-3 py-1.5 top-[410px] left-0 bg-[#ffffff05] border-[0.6px] border-solid border-[#ffffff21] items-center justify-center absolute"
          type="button"
          aria-expanded="true"
          aria-label="Hide progress panel"
          onClick={onHide}
        >
          <div className="relative w-[102.79px] h-5">
            <span className="absolute top-0 left-[calc(50.00%_-_35px)] font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] whitespace-nowrap [font-style:var(--body-font-style)]">
              Hide progress
            </span>

            <img
              className="absolute top-[7px] left-0 w-[9px] h-[5px]"
              alt=""
              src="https://c.animaapp.com/Pqm9zsUr/img/arrow-8--stroke-.svg"
              aria-hidden="true"
            />
          </div>
        </button>
      </footer>
    </aside>
  );
};
