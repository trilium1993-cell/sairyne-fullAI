import { useEffect, useRef, useState } from "react";
import { Step, NEXT } from "../flow/steps";
import { getScreenComponent } from "../flow/registry";
import { safeGetItem, safeSetItem, safeRemoveItem } from "../utils/storage";
import { getSelectedProject } from "../services/projects";

export default function ScreenManager() {
  const [currentStep, setCurrentStep] = useState<Step>("SignIn");
  const [history, setHistory] = useState<Step[]>([]);
  const lastAutoStepRef = useRef<Step | null>(null);
  const manualStayOnProjectsRef = useRef(false);
  const manualStayOnSignInRef = useRef(false);
  const bootHandledRef = useRef(false);
  const authedSinceRef = useRef<number | null>(null);
  const forceProjectsRef = useRef(false);
  const LAST_STEP_KEY = "sairyne_ui_last_step";
  const cachedOsBootIdRef = useRef<string | null>(null);

  // Capture the cached OS boot id (localStorage) on first mount, before JUCE inject overwrites it.
  // This lets us detect OS reboot even if `sairyne_last_os_boot_id` wasn't present for some reason.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      cachedOsBootIdRef.current = window.localStorage?.getItem("sairyne_os_boot_id") ?? null;
    } catch {
      cachedOsBootIdRef.current = null;
    }
  }, []);

  const isChatStep = (step: Step | string | null): step is Step => {
    return (
      step === "StartChat1" ||
      step === "Chat2" ||
      step === "Chat3" ||
      step === "Chat4" ||
      step === "Chat5" ||
      step === "Chat6Tips" ||
      step === "Chat7Tips2" ||
      step === "Chat8"
    );
  };

  const computeAutoStartStep = (): Step => {
    // Auth
    const token = safeGetItem("sairyne_access_token");
    const currentUser = safeGetItem("sairyne_current_user");
    const isAuthed = Boolean(token && currentUser);

    if (!isAuthed) return "SignIn";

    // If user explicitly chose to stay on Sign In (e.g. switching accounts), respect it.
    const lastUiStep = safeGetItem(LAST_STEP_KEY);
    if (lastUiStep === "SignIn") {
      return "SignIn";
    }

    // Computer reboot detection:
    // If OS boot changed, require password again (but keep draft email).
    const osBootId = safeGetItem("sairyne_os_boot_id");
    const lastOsBootId = safeGetItem("sairyne_last_os_boot_id");
    const previousOsBootId = lastOsBootId || cachedOsBootIdRef.current;
    if (osBootId && previousOsBootId && osBootId !== previousOsBootId) {
      safeRemoveItem("sairyne_access_token");
      safeRemoveItem("sairyne_current_user");
      safeRemoveItem("sairyne_selected_project");
      // Update last-os-boot so we don't repeatedly trigger after we route to SignIn.
      safeSetItem("sairyne_last_os_boot_id", osBootId);
      return "SignIn";
    }
    // Ensure we always have a baseline for next OS reboot.
    if (osBootId && !lastOsBootId) {
      safeSetItem("sairyne_last_os_boot_id", osBootId);
    }

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

    // Same DAW session (no host restart): resume last screen when reopening the plugin window.
    // If last screen was chat, keep user in chat; if it was projects, stay on projects.
    if (lastUiStep === "ChooseYourProject") {
      return "ChooseYourProject";
    }
    if (isChatStep(lastUiStep)) {
      // Only resume chat if a project is selected; otherwise fall back to projects.
      const selected = getSelectedProject();
      return selected ? (lastUiStep as Step) : "ChooseYourProject";
    }

    // Default after sign-in within same OS boot: start at projects.
    return "ChooseYourProject";
  };

  const tryAutoBootstrap = () => {
    try {
      // Determine auth status (sync reads; values may arrive async via JUCE events)
      const token = safeGetItem("sairyne_access_token");
      const currentUser = safeGetItem("sairyne_current_user");
      const isAuthed = Boolean(token && currentUser);

      if (isAuthed) {
        if (authedSinceRef.current === null) authedSinceRef.current = Date.now();
      } else {
        authedSinceRef.current = null;
      }

      // If the last saved UI step is SignIn, it must override anything else.
      // Important: we may initially route to Projects before this key arrives from JUCE,
      // and then our "stay on projects" guard would prevent correction. So handle it early.
      if (isAuthed) {
        const lastUiStep = safeGetItem(LAST_STEP_KEY);
        if (lastUiStep === "SignIn") {
          manualStayOnSignInRef.current = true;
          forceProjectsRef.current = false;
          manualStayOnProjectsRef.current = false;
          bootHandledRef.current = true;
          if (currentStep !== "SignIn") {
            setHistory([]);
            setCurrentStep("SignIn");
          }
          return;
        }
      }

      // OS reboot detection must run even if we previously "locked" the UI on Projects.
      // Otherwise, a late-arriving os_boot_id would never be able to force Sign In.
      if (isAuthed) {
        const osBootId = safeGetItem("sairyne_os_boot_id");
        const lastOsBootId = safeGetItem("sairyne_last_os_boot_id");
        const previousOsBootId = lastOsBootId || cachedOsBootIdRef.current;

        // If we have a stored last-os-boot-id but the current os-boot-id hasn't arrived yet,
        // wait briefly to avoid routing to Projects and getting stuck there.
        if (!osBootId && (lastOsBootId || cachedOsBootIdRef.current)) {
          const waitedMs = Date.now() - (authedSinceRef.current || Date.now());
          if (waitedMs < 2500) return;
        }

        if (osBootId && previousOsBootId && osBootId !== previousOsBootId) {
          safeRemoveItem("sairyne_access_token");
          safeRemoveItem("sairyne_current_user");
          safeRemoveItem("sairyne_selected_project");
          safeSetItem("sairyne_last_os_boot_id", osBootId);
          forceProjectsRef.current = false;
          manualStayOnProjectsRef.current = false;
          manualStayOnSignInRef.current = false;
          bootHandledRef.current = true;
          setHistory([]);
          setCurrentStep("SignIn");
          return;
        }
        if (osBootId && !lastOsBootId) {
          safeSetItem("sairyne_last_os_boot_id", osBootId);
        }
      }

      // Hard lock: if we decided "stay on projects" (e.g. after host restart),
      // never auto-jump into chat until the user explicitly selects a project (onNext).
      if (forceProjectsRef.current) {
        return;
      }

      // If user explicitly navigated to Sign In (e.g. switch account), don't auto-route away.
      if (manualStayOnSignInRef.current && currentStep === "SignIn") {
        return;
      }

      // If user is on the "Your projects" screen, never auto-route away from it.
      // Navigation to chat must be explicit (project click / create+select).
      if (currentStep === "ChooseYourProject" && isAuthed) {
        return;
      }

      // Prevent repeated boot-id writes / flip-flopping.
      // Once we have handled a "new host boot" decision, we can continue normal logic.
      if (!bootHandledRef.current) {
        const runtimeBootId = safeGetItem("sairyne_runtime_boot_id");
        const lastBootId = safeGetItem("sairyne_last_boot_id");

        // If we're authenticated but runtime boot id hasn't arrived yet, wait briefly
        // so we don't accidentally auto-resume chat before the host-boot decision is known.
        if (isAuthed && !runtimeBootId) {
          const waitedMs = Date.now() - (authedSinceRef.current || Date.now());
          if (waitedMs < 2500) return;
          // If boot id still didn't arrive, default to Projects (safe choice).
          forceProjectsRef.current = true;
          manualStayOnProjectsRef.current = true;
          setHistory([]);
          setCurrentStep("ChooseYourProject");
          bootHandledRef.current = true;
          return;
        }

        if (runtimeBootId && runtimeBootId !== lastBootId) {
          bootHandledRef.current = true;
          forceProjectsRef.current = true;
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

  // Persist last visible screen so reopening the plugin window resumes the same UI (projects vs chat).
  useEffect(() => {
    try {
      safeSetItem(LAST_STEP_KEY, currentStep);
    } catch {
      // best-effort
    }
  }, [currentStep]);

  const onNext = () => {
    const nextStep = NEXT[currentStep];
    if (nextStep) {
      if (currentStep === "ChooseYourProject") {
        // User explicitly picked a project (or created one) -> allow auto-flow again.
        forceProjectsRef.current = false;
        manualStayOnProjectsRef.current = false;
      }
      if (currentStep === "SignIn") {
        manualStayOnSignInRef.current = false;
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
      if (previousStep !== "SignIn") {
        manualStayOnSignInRef.current = false;
      }
      return;
    }

    // From Projects screen, allow returning to Sign In (e.g. user wants to switch accounts).
    if (currentStep === "ChooseYourProject") {
      setHistory([]);
      setCurrentStep("SignIn");
      manualStayOnSignInRef.current = true;
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
