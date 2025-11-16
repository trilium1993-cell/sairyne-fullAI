import { getActiveUserEmail } from "./auth";
import { safeGetItem, safeSetItem, safeRemoveItem, isLocalStorageAvailable } from '../utils/storage';

export interface StoredProject {
  id: number;
  name: string;
  createdAt: string;
  ownerEmail: string;
}

const PROJECTS_KEY = "sairyne_projects";
const SELECTED_PROJECT_KEY = "sairyne_selected_project";
const LEGACY_OWNER = "__legacy__";

const resolveOwnerEmail = (email: string): string =>
  email === "__guest__" ? LEGACY_OWNER : email;

function parseProjects(): StoredProject[] {
  if (typeof window === "undefined") return [];
  
  try {
    const raw = safeGetItem(PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((project) => {
      const ownerEmail = typeof project.ownerEmail === "string" && project.ownerEmail.length > 0
        ? project.ownerEmail
        : LEGACY_OWNER;
      return {
        id: typeof project.id === "number" ? project.id : Date.now(),
        name: typeof project.name === "string" ? project.name : `Project ${Date.now()}`,
        createdAt: typeof project.createdAt === "string" ? project.createdAt : new Date().toISOString(),
        ownerEmail,
      };
    });
  } catch (error) {
    console.warn('[Projects] Error parsing projects:', error);
    return [];
  }
}

function persistProjects(projects: StoredProject[]) {
  if (typeof window === "undefined") return;
  
  console.log('[Projects] 🔄 persistProjects called with', projects.length, 'projects');
  const projectsJson = JSON.stringify(projects);
  console.log('[Projects] 📦 Projects JSON length:', projectsJson.length);
  console.log('[Projects] 📦 Projects JSON preview:', projectsJson.substring(0, 200));
  
  // Debug: send message to JUCE to log this call
  try {
    if (typeof window !== 'undefined') {
      const debugUrl = `juce://debug?message=persistProjects_called_with_${projects.length}_projects_json_length_${projectsJson.length}`;
      // Try top/parent first (for iframe), fallback to window
      if (window.top && window.top !== window) {
        window.top.location.href = debugUrl;
      } else if (window.parent && window.parent !== window) {
        window.parent.location.href = debugUrl;
      } else if (window.location) {
        window.location.href = debugUrl;
      }
    }
  } catch (e) {
    console.warn('[Projects] Failed to send debug message:', e);
  }
  
  // safeSetItem will handle JUCE fallback automatically
  console.log('[Projects] 🔄 Calling safeSetItem for', PROJECTS_KEY);
  console.log('[Projects] 🔄 Checking if window.saveToJuce exists:', typeof (window as any).saveToJuce);
  
  const success = safeSetItem(PROJECTS_KEY, projectsJson);
  if (!success) {
    console.warn('[Projects] ⚠️ Failed to persist projects - localStorage blocked and JUCE not available');
  } else {
    console.log('[Projects] ✅ persistProjects completed successfully');
    // Double-check: try to read it back immediately
    setTimeout(() => {
      const readBack = safeGetItem(PROJECTS_KEY);
      if (readBack) {
        console.log('[Projects] ✅ Verified: projects data persisted successfully, length:', readBack.length);
      } else {
        console.warn('[Projects] ⚠️ Warning: projects data not found after save, length:', readBack?.length || 0);
      }
    }, 500);
  }
}

function adoptLegacyProjects(email: string, projects: StoredProject[]): StoredProject[] {
  if (email === LEGACY_OWNER) {
    return projects;
  }

  if (!projects.some((project) => project.ownerEmail === LEGACY_OWNER)) {
    return projects;
  }

  const updated = projects.map((project) =>
    project.ownerEmail === LEGACY_OWNER
      ? { ...project, ownerEmail: email }
      : project
  );

  persistProjects(updated);
  return updated;
}

export function listProjects(): StoredProject[] {
  const ownerEmail = resolveOwnerEmail(getActiveUserEmail());
  const projects = adoptLegacyProjects(ownerEmail, parseProjects());
  return projects
    .filter((project) => project.ownerEmail === ownerEmail)
    .sort((a, b) => new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf());
}

export function saveProjects(projects: StoredProject[]): void {
  const ownerEmail = resolveOwnerEmail(getActiveUserEmail());
  const allProjects = parseProjects().filter((project) => project.ownerEmail !== ownerEmail);
  const normalized = projects.map((project) => ({
    id: project.id,
    name: project.name,
    createdAt: project.createdAt ?? new Date().toISOString(),
    ownerEmail,
  }));
  persistProjects([...allProjects, ...normalized]);
}

export function createProject(name?: string): StoredProject {
  console.log('[Projects] 🔄 createProject called with name:', name);
  
  // Debug: send message to JUCE immediately
  try {
    if (typeof window !== 'undefined') {
      const debugUrl = `juce://debug?message=createProject_called_with_name_${name || 'undefined'}`;
      if (window.top && window.top !== window) {
        window.top.location.href = debugUrl;
      } else if (window.parent && window.parent !== window) {
        window.parent.location.href = debugUrl;
      } else if (window.location) {
        window.location.href = debugUrl;
      }
    }
  } catch (e) {
    console.warn('[Projects] Failed to send debug message from createProject:', e);
  }
  
  const ownerEmail = resolveOwnerEmail(getActiveUserEmail());
  const newProject: StoredProject = {
    id: Date.now(),
    name: name?.trim() ? name.trim() : `New Project ${Date.now()}`,
    createdAt: new Date().toISOString(),
    ownerEmail,
  };

  const projects = parseProjects();
  projects.push(newProject);
  console.log('[Projects] 🔄 About to call persistProjects - projects array:', JSON.stringify(projects));
  persistProjects(projects);
  return newProject;
}

export function renameProject(projectId: number, newName: string): StoredProject[] {
  const ownerEmail = resolveOwnerEmail(getActiveUserEmail());
  const projects = parseProjects();
  const updated = projects.map((project) =>
    project.id === projectId && project.ownerEmail === ownerEmail
      ? { ...project, name: newName.trim() }
      : project
  );
  persistProjects(updated);
  return listProjects();
}

export function removeProject(projectId: number): StoredProject[] {
  const ownerEmail = resolveOwnerEmail(getActiveUserEmail());
  const projects = parseProjects();
  const updated = projects.filter((project) => !(project.ownerEmail === ownerEmail && project.id === projectId));
  persistProjects(updated);
  return listProjects();
}

export function getLatestProject(): StoredProject | null {
  const projects = listProjects();
  if (projects.length === 0) return null;
  return [...projects].sort((a, b) => new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf())[projects.length - 1];
}

export function setSelectedProject(project: StoredProject | null): void {
  if (typeof window === "undefined") return;
  
  try {
    if (!project) {
      safeRemoveItem(SELECTED_PROJECT_KEY);
      return;
    }
    const payload = { id: project.id, ownerEmail: project.ownerEmail, name: project.name };
    const success = safeSetItem(SELECTED_PROJECT_KEY, JSON.stringify(payload));
    if (!success) {
      console.warn('[Projects] Failed to set selected project - localStorage blocked and JUCE not available');
    }
  } catch (error) {
    console.error('[Projects] Error setting selected project:', error);
  }
}

export function getSelectedProject(): StoredProject | null {
  if (typeof window === "undefined") return null;
  
  try {
    const raw = safeGetItem(SELECTED_PROJECT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.id !== "number") return null;
    const projects = listProjects();
    return projects.find((project) => project.id === parsed.id) ?? null;
  } catch (error) {
    console.warn('[Projects] Error getting selected project:', error);
    return null;
  }
}

export function clearSelectedProject() {
  if (typeof window === "undefined") return;
  safeRemoveItem(SELECTED_PROJECT_KEY);
}
