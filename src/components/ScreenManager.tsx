import { useEffect, useRef, useState } from "react";
import { Step, NEXT } from "../flow/steps";
import { getScreenComponent } from "../flow/registry";
import { safeGetItem, safeSetItem } from "../utils/storage";
import { getLatestProject, getSelectedProject, setSelectedProject } from "../services/projects";

export default function ScreenManager() {
  const [currentStep, setCurrentStep] = useState<Step>("SignIn");
  const [history, setHistory] = useState<Step[]>([]);
  const lastAutoStepRef = useRef<Step | null>(null);
  const manualStayOnProjectsRef = useRef(false);
  const bootHandledRef = useRef(false);
  const firstBootstrapAtRef = useRef<number | null>(null);

  const computeAutoStartStep = (): Step => {
    // Auth
    const token = safeGetItem("sairyne_access_token");
    const currentUser = safeGetItem("sairyne_current_user");
    const isAuthed = Boolean(token && currentUser);

    if (!isAuthed) return "SignIn";

    // Host boot detection:
    // If Ableton/host was restarted, force the "Your Projects" screen first.
    // We compare a runtime boot id injected by C++ to the last seen boot id persisted in PropertiesFile.
    const runtimeBootId = safeGetItem("sairyne_runtime_boot_id");
    const lastBootId = safeGetItem("sairyne_last_boot_id");
    if (runtimeBootId && runtimeBootId !== lastBootId) {
      // Persist for next opens within the same host process.
      safeSetItem("sairyne_last_boot_id", runtimeBootId);
      return "ChooseYourProject";
    }

    // Project selection
    const selected = getSelectedProject();
    if (selected) return "StartChat1";

    // If there are projects, auto-select the latest to avoid forcing the chooser screen.
    const rawProjects = safeGetItem("sairyne_projects");
    if (rawProjects) {
      const latest = getLatestProject();
      if (latest) {
        setSelectedProject(latest);
        return "StartChat1";
      }
      return "ChooseYourProject";
    }

    // No projects stored yet -> show onboarding
    return "CreateYourFirstProject";
  };

  const tryAutoBootstrap = () => {
    try {
      if (firstBootstrapAtRef.current === null) {
        firstBootstrapAtRef.current = Date.now();
      }

      // Prevent repeated boot-id writes / flip-flopping.
      // Once we have handled a "new host boot" decision, we can continue normal logic.
      if (!bootHandledRef.current) {
        const runtimeBootId = safeGetItem("sairyne_runtime_boot_id");
        const lastBootId = safeGetItem("sairyne_last_boot_id");

        // If we're authenticated but runtime boot id hasn't arrived yet, wait briefly
        // so we don't accidentally auto-resume chat using stale cached values.
        const token = safeGetItem("sairyne_access_token");
        const currentUser = safeGetItem("sairyne_current_user");
        const isAuthed = Boolean(token && currentUser);
        const waitedMs = Date.now() - (firstBootstrapAtRef.current || Date.now());
        if (isAuthed && !runtimeBootId && waitedMs < 2000) {
          return;
        }

        if (runtimeBootId && runtimeBootId !== lastBootId) {
          bootHandledRef.current = true;
          manualStayOnProjectsRef.current = true;
          setHistory([]);
          setCurrentStep("ChooseYourProject");
          // safeSetItem already called inside computeAutoStartStep on next tick;
          // but do it here too for deterministic behavior.
          safeSetItem("sairyne_last_boot_id", runtimeBootId);
          return;
        }
        if (runtimeBootId && runtimeBootId === lastBootId) {
          bootHandledRef.current = true;
        }
      }

      // If user explicitly navigated to the projects list, don't auto-jump back into chat.
      if (manualStayOnProjectsRef.current && currentStep === "ChooseYourProject") {
        return;
      }
      const step = computeAutoStartStep();
      // Avoid thrashing / repeated state updates
      if (lastAutoStepRef.current === step) return;
      lastAutoStepRef.current = step;

      if (step !== currentStep) {
        setHistory([]);
        setCurrentStep(step);
      }
    } catch {
      // best-effort; fall back to manual navigation
    }
  };

  useEffect(() => {
    // Try immediately (may still be before JUCE inject), then retry when data arrives.
    tryAutoBootstrap();

    const onDataLoaded = () => tryAutoBootstrap();

    if (typeof window !== "undefined") {
      window.addEventListener("sairyne-init-loaded", onDataLoaded as any);
      window.addEventListener("sairyne-data-loaded", onDataLoaded as any);
    }

    // Small retry window to handle AU timing / slow init without needing user interaction.
    const t = window.setInterval(() => tryAutoBootstrap(), 600);
    const stop = window.setTimeout(() => window.clearInterval(t), 6000);

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("sairyne-init-loaded", onDataLoaded as any);
        window.removeEventListener("sairyne-data-loaded", onDataLoaded as any);
      }
      window.clearInterval(t);
      window.clearTimeout(stop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onNext = () => {
    const nextStep = NEXT[currentStep];
    if (nextStep) {
      if (currentStep === "ChooseYourProject") {
        manualStayOnProjectsRef.current = false;
      }
      setHistory(prev => [...prev, currentStep]);
      setCurrentStep(nextStep);
    }
  };

  const onBack = () => {
    if (history.length > 0) {
      const previousStep = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setCurrentStep(previousStep);
      if (previousStep !== "ChooseYourProject") {
        manualStayOnProjectsRef.current = false;
      }
      return;
    }

    // If there is no history (e.g. auto-resume straight into chat),
    // allow "Return to Your Projects" to work by going to the projects list.
    if (
      currentStep === "StartChat1" ||
      currentStep === "Chat2" ||
      currentStep === "Chat3" ||
      currentStep === "Chat4" ||
      currentStep === "Chat5" ||
      currentStep === "Chat6Tips" ||
      currentStep === "Chat7Tips2" ||
      currentStep === "Chat8"
    ) {
      manualStayOnProjectsRef.current = true;
      setHistory([]);
      setCurrentStep("ChooseYourProject");
    }
  };


  // Get the component for current step
  const ScreenComponent = getScreenComponent(currentStep);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0b0a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <ScreenComponent onNext={onNext} onBack={onBack} />
    </div>
  );
}
