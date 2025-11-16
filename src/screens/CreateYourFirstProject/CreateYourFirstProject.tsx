import React, { useState } from "react";
import { Window } from "../../components/Window";
import { StoredProject, createProject, listProjects, setSelectedProject } from "../../services/projects";

interface CreateYourFirstProjectProps {
  onNext: () => void;
  onBack: () => void;
}

export const CreateYourFirstProject = ({ onNext, onBack }: CreateYourFirstProjectProps): JSX.Element => {
  const [projectName, setProjectName] = useState("");
  const [isExactMatch, setIsExactMatch] = useState(false);
  const [isPartialMatch, setIsPartialMatch] = useState(false);
  const [foundProject, setFoundProject] = useState<StoredProject | null>(null);

  // Проверяем существование проекта при изменении названия
  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setProjectName(name);
    
    if (name.trim()) {
      const existingProjects = listProjects();

      const exactMatch = existingProjects.find(
        (project) => project.name.toLowerCase() === name.trim().toLowerCase()
      );

      if (exactMatch) {
        setIsExactMatch(true);
        setIsPartialMatch(false);
        setFoundProject(exactMatch);
        return;
      }

      const partialMatch = existingProjects.find(
        (project) =>
          project.name.toLowerCase().includes(name.trim().toLowerCase()) ||
          name.trim().toLowerCase().includes(project.name.toLowerCase())
      );

      if (partialMatch) {
        setIsExactMatch(false);
        setIsPartialMatch(true);
        setFoundProject(partialMatch);
      } else {
        setIsExactMatch(false);
        setIsPartialMatch(false);
        setFoundProject(null);
      }
    } else {
      setIsExactMatch(false);
      setIsPartialMatch(false);
      setFoundProject(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Кнопка недоступна если поле пустое ИЛИ есть точное совпадение
    if (!projectName.trim() || isExactMatch) {
      return;
    }

    const newProject = createProject(projectName.trim());
    setSelectedProject(newProject);
    onNext();
  };

  const handleClose = () => {
    // Close functionality
  };

  const handleExpand = () => {
    // Expand functionality
  };

  const handleGoToProject = () => {
    if (foundProject) {
      setSelectedProject(foundProject);
      onNext();
    }
  };

  return (
    <Window
      title="Sairyne"
      onMinimize={handleExpand}
      onClose={handleClose}
    >
      <main className="absolute top-[34px] left-[3px] w-[377px] h-[810px] bg-[#141414] rounded-[7px] overflow-hidden">
        <div
          className="absolute top-[calc(50.00%_-_429px)] left-[calc(50.00%_-_140px)] w-[278px] h-[278px] bg-[#6e24ab5e] rounded-[139px] blur-[122px]"
          aria-hidden="true"
        />

        <div className="absolute top-[199px] left-[139.5px] w-[98px] h-[98px]">
          <img
            className="w-[98px] h-[98px] aspect-[1]"
            alt="Music note icon with plus symbol"
            src="https://c.animaapp.com/1PDOzWMk/img/0fdfd0b2-0c1f-4548-b8f7-4fe33272f0c2-1@2x.png"
          />
        </div>

        <h2 className="absolute top-[309px] left-[41.5px] w-[294px] font-h1 font-[number:var(--h1-font-weight)] text-[#f7efff] text-[length:var(--h1-font-size)] text-center tracking-[var(--h1-letter-spacing)] leading-[var(--h1-line-height)] [font-style:var(--h1-font-style)]">
          Create your first project
        </h2>

        <p className="absolute top-[387px] left-[31.5px] w-[314px] font-title font-[number:var(--title-font-weight)] text-[#ffffff8f] text-[length:var(--title-font-size)] text-center tracking-[var(--title-letter-spacing)] leading-[var(--title-line-height)] [font-style:var(--title-font-style)]">
          Tip: Name it the same as your Ableton project for better navigation.
        </p>

        <form
          onSubmit={handleSubmit}
          className="absolute top-[461px] left-[35px] w-[307px] flex flex-col"
        >
          <div className="w-[307px] h-[40px] flex items-center bg-[#ffffff0d] rounded-[36px] border border-solid border-[#ffffff1c]">
            <label htmlFor="project-name-input" className="sr-only">
              Project name
            </label>
            <input
              id="project-name-input"
              className="w-full h-full px-[14px] py-[10px] font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)] [background:transparent] border-[none] placeholder:text-[#ffffff80] outline-none"
              placeholder="Project name"
              type="text"
              value={projectName}
              onChange={handleProjectNameChange}
              autoComplete="off"
              autoFocus
            />
          </div>

          {projectName.trim() && (
            <div className="mt-2 flex items-center justify-center gap-2">
              {isExactMatch && foundProject ? (
                <>
                  <p className="text-sm text-[#7322b6] text-center">
                    Found exact project: {foundProject.name}
                  </p>
                  <button
                    onClick={handleGoToProject}
                    className="w-6 h-6 flex items-center justify-center bg-[#7322b6] rounded-full hover:bg-[#8a2db8] transition-colors"
                    aria-label="Go to found project"
                    type="button"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              ) : isPartialMatch && foundProject ? (
                <p className="text-sm text-[#ffa500] text-center">
                  Similar project found: {foundProject.name} - Create new one
                </p>
              ) : (
                <p className="text-sm text-[#ffffff80] text-center">
                  New project will be created
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            className="flex w-[307px] h-[40px] items-center justify-center gap-2.5 px-[10px] py-[10px] mt-[16px] rounded-[36px] border-[none] bg-[linear-gradient(134deg,rgba(115,34,182,1)_0%,rgba(83,12,141,1)_100%)] before:content-[''] before:absolute before:inset-0 before:p-px before:rounded-[36px] before:[background:linear-gradient(180deg,rgba(255,255,255,0.11)_0%,rgba(255,255,255,0.01)_100%)] before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:z-[1] before:pointer-events-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed relative"
            disabled={!projectName.trim() || isExactMatch}
          >
            <span className="relative w-fit font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] text-center tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] whitespace-nowrap [font-style:var(--body-font-style)]">
              Create
            </span>
          </button>
        </form>
      </main>
    </Window>
  );
};
