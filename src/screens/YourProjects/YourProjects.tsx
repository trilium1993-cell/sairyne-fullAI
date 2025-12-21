import React, { useState, useEffect, useRef } from "react";
import { Window } from "../../components/Window";
import {
  StoredProject,
  createProject,
  listProjects,
  removeProject,
  renameProject,
  setSelectedProject,
  clearSelectedProject,
  getSelectedProject,
} from "../../services/projects";

interface YourProjectsProps {
  onNext: () => void;
  onBack: () => void;
}

export const YourProjects = ({ onNext, onBack }: YourProjectsProps): JSX.Element => {
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<StoredProject[]>([]);
  const [selectedProjectState, setSelectedProjectState] = useState<StoredProject | null>(null);
  const [contextMenu, setContextMenu] = useState<{ projectId: number; x: number; y: number } | null>(null);
  const [editingProject, setEditingProject] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [newlyCreatedProjectId, setNewlyCreatedProjectId] = useState<number | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Загружаем проекты из localStorage при монтировании компонента
  useEffect(() => {
    const savedProjects = listProjects();
    setProjects(savedProjects);
    setFilteredProjects(savedProjects);

    const preselected = getSelectedProject();
    if (preselected) {
      setSelectedProjectState(preselected);
      clearSelectedProject();
    }
  }, []);

  // Фильтруем проекты при изменении поискового запроса
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projects]);

  // Обработка клика вне контекстного меню для его закрытия
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAddProject = () => {
    const newProject = createProject();
    const updatedProjects = listProjects();
    setProjects(updatedProjects);
    setFilteredProjects(updatedProjects);
    setSelectedProjectState(newProject);
    setNewlyCreatedProjectId(newProject.id);
    // Stay on "Your projects" and prompt user to rename immediately
    setEditingProject(newProject.id);
    setEditName(newProject.name);
  };

  const handleProjectClick = (projectId: number) => {
    if (import.meta.env.DEV) {
      console.debug('[yourProjects] open project', projectId);
    }
    
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setSelectedProjectState(project);
      if (import.meta.env.DEV) {
        console.debug('[yourProjects] selected project saved', project);
      }
    }
    
    // Переходим к чату для работы с проектом
    onNext();
  };

  const handleMenuClick = (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      projectId,
      x: rect.right - 120, // Позиционируем меню слева от кнопки
      y: rect.bottom + 5
    });
  };

  const handleEditProject = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setEditingProject(projectId);
      setEditName(project.name);
      setContextMenu(null);
    }
  };

  const handleDeleteProject = (projectId: number) => {
    const updatedForUser = removeProject(projectId);
    setProjects(updatedForUser);
    setFilteredProjects(updatedForUser);
    if (selectedProjectState?.id === projectId) {
      setSelectedProjectState(null);
    }
    setContextMenu(null);
  };

  const handleSaveEdit = (projectId: number) => {
    if (editName.trim()) {
      const updated = renameProject(projectId, editName.trim());
      setProjects(updated);
      setFilteredProjects(updated);
      setEditingProject(null);
      setEditName("");
      if (newlyCreatedProjectId === projectId) {
        setNewlyCreatedProjectId(null);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
    setEditName("");
    setNewlyCreatedProjectId(null);
  };

  // Закрываем контекстное меню при клике вне
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleClose = () => {
    if (import.meta.env.DEV) {
      console.debug('[yourProjects] close window');
    }
  };

  const handleExpand = () => {
    if (import.meta.env.DEV) {
      console.debug('[yourProjects] expand window');
    }
  };

  return (
    <>
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

        <h2 className="absolute top-[25px] left-[calc(50.00%_-_146px)] font-h2 font-[number:var(--h2-font-weight)] text-[#f7efff] text-[length:var(--h2-font-size)] tracking-[var(--h2-letter-spacing)] leading-[var(--h2-line-height)] [font-style:var(--h2-font-style)]">
          Your projects
        </h2>

        <p
          id="dialog-description"
          className="absolute top-[70px] left-[calc(50.00%_-_146px)] w-[328px] font-title font-[number:var(--title-font-weight)] text-[#ffffff8f] text-[length:var(--title-font-size)] tracking-[var(--title-letter-spacing)] leading-[var(--title-line-height)] [font-style:var(--title-font-style)]"
        >
          Let&apos;s create your first project to get started.
        </p>

        <div className="absolute top-[121px] left-[15px] w-[297px] h-[42px] flex items-center bg-[#0000003d] rounded-[64px] border border-solid border-[#ffffff0f]">
          <label htmlFor="project-search" className="sr-only">
            Search projects
          </label>
          <div className="relative flex items-center w-full pl-4">
            <img
              className="absolute left-4 w-5 h-5 pointer-events-none"
              alt=""
              src="https://c.animaapp.com/R9ALkWwO/img/magnifying-glass-light-2.svg"
              aria-hidden="true"
            />
            <input
              id="project-search"
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search..."
              className="w-full pl-[28px] pr-4 font-body font-[number:var(--body-font-weight)] text-[#ffffff80] text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)] bg-transparent outline-none placeholder:text-[#ffffff80]"
              aria-label="Search projects"
            />
          </div>
        </div>

        <button
          onClick={handleAddProject}
          className="absolute top-[122px] left-[calc(50.00%_+_132px)] w-10 h-10 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
          aria-label="Add new project"
          type="button"
        >
          <img
            className="w-10 h-10"
            alt=""
            src="https://c.animaapp.com/R9ALkWwO/img/frame-35.svg"
            aria-hidden="true"
          />
        </button>

        <nav aria-label="Projects list" className="absolute top-[183px] left-0 right-0 bottom-0 overflow-y-auto">
          <ul className="list-none p-0 m-0 relative">
            {(() => {
              // Сортируем проекты: выделенный проект первым, остальные по дате создания
              const sortedProjects = [...filteredProjects].sort((a, b) => {
                if (selectedProjectState && a.id === selectedProjectState.id) return -1;
                if (selectedProjectState && b.id === selectedProjectState.id) return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              });

              return sortedProjects.map((project, index) => {
                const isSelected = selectedProjectState && project.id === selectedProjectState.id;
                const isEditing = editingProject === project.id;
                const isNew = newlyCreatedProjectId === project.id;
                
                return (
                  <li key={project.id}>
                    <article
                      className={`absolute left-4 w-[345px] h-[71px] rounded-[10px] border border-solid transition-all ${
                        isSelected 
                          ? 'bg-[#7322b620] border-[#7322b6] shadow-lg shadow-[#7322b640]' 
                          : 'bg-[#ffffff08] border-[#ffffff0f]'
                      } ${isNew ? 'ring-1 ring-[#7322b6] ring-offset-0' : ''}`}
                      style={{ top: `${index * 85}px` }}
                    >
                      {isEditing ? (
                        // Режим редактирования
                        <div className="w-full h-full p-3 flex flex-col gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2 py-1 bg-[#ffffff0d] border border-[#ffffff1c] rounded text-white text-sm outline-none focus:border-[#7322b6]"
                            autoFocus
                            onFocus={(e) => {
                              // Select default name so user can immediately rename
                              e.currentTarget.select();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(project.id);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(project.id)}
                              className="px-3 py-1 bg-[#7322b6] text-white text-xs rounded hover:bg-[#8a2db8] transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 bg-[#ffffff1c] text-white text-xs rounded hover:bg-[#ffffff2c] transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Обычный режим
                        <>
                          <button
                            onClick={() => handleProjectClick(project.id)}
                            className="w-full h-full text-left cursor-pointer hover:bg-[#ffffff0f] transition-colors rounded-[10px]"
                            aria-label={`Open project ${project.name}`}
                            type="button"
                          >
                            <div className="absolute top-3 left-6 right-12 flex flex-col items-start gap-1.5">
                              <h3 className={`font-title font-[number:var(--title-font-weight)] text-[length:var(--title-font-size)] tracking-[var(--title-letter-spacing)] leading-[var(--title-line-height)] [font-style:var(--title-font-style)] break-words max-w-[280px] truncate ${
                                isSelected ? 'text-[#7322b6]' : 'text-white'
                              }`}>
                                {project.name}
                              </h3>

                              <p className="font-helper font-[number:var(--helper-font-weight)] text-[#ffffff80] text-[length:var(--helper-font-size)] tracking-[var(--helper-letter-spacing)] leading-[var(--helper-line-height)] [font-style:var(--helper-font-style)] break-words max-w-[280px] truncate">
                                Created: {new Date(project.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </button>

                          <button
                            onClick={(e) => handleMenuClick(project.id, e)}
                            className="absolute top-[7px] right-[12px] w-3.5 h-4 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                            aria-label={`Open menu for ${project.name}`}
                            type="button"
                          >
                            <img
                              className="w-3.5 h-4"
                              alt=""
                              src="https://c.animaapp.com/R9ALkWwO/img/ellipsis-1.svg"
                              aria-hidden="true"
                            />
                          </button>
                        </>
                      )}
                    </article>
                  </li>
                );
              });
            })()}
          </ul>
        </nav>
      </main>
      </Window>

      {/* Контекстное меню в стиле LearnMode */}
      {contextMenu && (
        <div
          className="fixed z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <div className="relative" ref={contextMenuRef}>
            {/* Контекстное меню Frame */}
            <div
              className="flex flex-col w-36 items-start gap-2 pt-3 pb-3 px-3 relative bg-[#110a17] rounded-md border-[0.5px] border-solid border-[#e8ceff30]"
              role="menu"
              aria-labelledby="project-actions-label"
            >
              <div
                id="project-actions-label"
                className="relative w-fit mt-[-0.50px] [font-family:'DM_Sans',Helvetica] font-light text-[#ffffff80] text-[10px] tracking-[0.70px] leading-[13px] whitespace-nowrap"
              >
                PROJECT ACTIONS
              </div>

              <div className="flex flex-col items-start gap-1 relative self-stretch w-full">
                {/* Edit Name */}
                <div className="h-8 relative self-stretch w-full">
                  <button
                    onClick={() => handleEditProject(contextMenu.projectId)}
                    className="h-8 relative self-stretch w-full hover:bg-[#ffffff08] rounded-md transition-colors cursor-pointer"
                    role="menuitem"
                    type="button"
                  >
                    <div className="absolute top-1.5 left-2 flex items-center gap-2">
                      <div className="relative w-3.5 h-3.5">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div className="relative w-fit [font-family:'DM_Sans',Helvetica] font-normal text-white text-[12px] tracking-[0px] leading-[16px] whitespace-nowrap">
                        Edit Name
                      </div>
                    </div>
                  </button>
                </div>

                {/* Delete */}
                <div className="h-8 relative self-stretch w-full">
                  <button
                    onClick={() => handleDeleteProject(contextMenu.projectId)}
                    className="h-8 relative self-stretch w-full hover:bg-[#ff000008] rounded-md transition-colors cursor-pointer"
                    role="menuitem"
                    type="button"
                  >
                    <div className="absolute top-1.5 left-2 flex items-center gap-2">
                      <div className="relative w-3.5 h-3.5">
                        <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </div>
                      <div className="relative w-fit [font-family:'DM_Sans',Helvetica] font-normal text-red-400 text-[12px] tracking-[0px] leading-[16px] whitespace-nowrap">
                        Delete
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
