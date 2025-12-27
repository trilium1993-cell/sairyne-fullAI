import { useEffect, useRef, useState } from "react";
import { Step, NEXT } from "../flow/steps";
import { getScreenComponent } from "../flow/registry";
import { safeGetItem, safeSetItem } from "../utils/storage";
import { getSelectedProject } from "../services/projects";
import { setGlobalLoading } from "../services/loadingService";
import { resolveIsEmbedded } from "../utils/embed";

export default function ScreenManager() {
  const [currentStep, setCurrentStep] = useState<Step>("SignIn");
  const [history, setHistory] = useState<Step[]>([]);
  const [isOsGatePending, setIsOsGatePending] = useState(false);
  const isEmbedded = resolveIsEmbedded();
  const lastAutoStepRef = useRef<Step | null>(null);
  const manualStayOnProjectsRef = useRef(false);
  const manualStayOnSignInRef = useRef(false);
  const bootHandledRef = useRef(false);
  const authedSinceRef = useRef<number | null>(null);
  const forceProjectsRef = useRef(false);
  const LAST_STEP_KEY = "sairyne_ui_last_step";
  const PIN_SIGNIN_KEY = "sairyne_ui_pin_signin";
  const BUILD_KEY = "sairyne_web_build";
  const BUILD_TAG = "fix-restore-pro-mode-1";

  // JUCE-side persistence currently rejects empty values (see Sairyne.log).
  // Use a non-empty tombstone for "clearing" persisted keys.
  const TOMBSTONE = "0";

  const clearAuthAndProject = (nextOsBootId?: string) => {
    try {
      // Keep current_user for convenience (prefill email), but invalidate auth token.
      safeSetItem("sairyne_access_token", TOMBSTONE);
      safeSetItem("sairyne_selected_project", TOMBSTONE);
      if (nextOsBootId) {
        safeSetItem("sairyne_last_os_boot_id", nextOsBootId);
      }
    } catch {
      // best-effort
    }
  };

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
    const isAuthed = Boolean(token && token !== TOMBSTONE && currentUser && currentUser !== TOMBSTONE);

    if (!isAuthed) return "SignIn";

    // If user explicitly pinned Sign In (e.g. switching accounts), respect it.
    // IMPORTANT: do NOT treat LAST_STEP_KEY === "SignIn" as a pin, because the app
    // starts on SignIn before JUCE data arrives and would create a permanent loop.
    const pinnedSignIn = safeGetItem(PIN_SIGNIN_KEY);
    if (pinnedSignIn === "1") return "SignIn";

    // Computer reboot logic (STRICT):
    // After an OS reboot we must always require password again.
    // We only allow auto-start into Projects when:
    //   osBootId is loaded AND lastOsBootId exists AND they match.
    const osBootId = safeGetItem("sairyne_os_boot_id");
    const lastOsBootId = safeGetItem("sairyne_last_os_boot_id");

    // If we can't verify the OS boot id yet, never auto-route away from Sign In.
    if (!osBootId) return "SignIn";

    // If baseline hasn't loaded yet (JUCE may inject it async), wait. Do NOT clear auth here.
    if (lastOsBootId == null) return "SignIn";
    // If baseline is explicitly missing (tombstone), require login and establish baseline.
    // IMPORTANT: do NOT clear the token just because baseline is missing.
    // That was causing "random sign-outs" when the baseline key wasn't persisted yet.
    // We still require Sign In UI, but we keep persisted auth intact.
    if (lastOsBootId === TOMBSTONE) return "SignIn";

    // Reboot detected -> clear auth and require login.
    if (osBootId !== lastOsBootId) {
      clearAuthAndProject(osBootId);
      return "SignIn";
    }

    // Host boot detection:
    // If Ableton/host was restarted, force the "Your Projects" screen first.
    // We compare a runtime boot id injected by C++ to the last seen boot id persisted in PropertiesFile.
    const runtimeBootId = safeGetItem("sairyne_runtime_boot_id");
    const lastBootId = safeGetItem("sairyne_last_boot_id");
    if (runtimeBootId && runtimeBootId !== lastBootId) {
      // Host restart should also clear any "pinned Sign In" (it is intended for a live session account switch).
      safeSetItem(PIN_SIGNIN_KEY, TOMBSTONE);
      // Persist for next opens within the same host process.
      safeSetItem("sairyne_last_boot_id", runtimeBootId);
      return "ChooseYourProject";
    }

    // Same DAW session (no host restart): resume last screen when reopening the plugin window.
    // If last screen was chat, keep user in chat; if it was projects, stay on projects.
    const lastUiStep = safeGetItem(LAST_STEP_KEY);
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
      const isAuthed = Boolean(token && token !== TOMBSTONE && currentUser && currentUser !== TOMBSTONE);

      if (isAuthed) {
        if (authedSinceRef.current === null) authedSinceRef.current = Date.now();
      } else {
        authedSinceRef.current = null;
      }

      // If user pinned Sign In, it must override anything else.
      // This is different from LAST_STEP_KEY === "SignIn" (which can be a transient initial state).
      if (isAuthed) {
        const pinnedSignIn = safeGetItem(PIN_SIGNIN_KEY);
        if (pinnedSignIn === "1") {
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

      // OS reboot gate (STRICT):
      // If we're "authed" but can't confirm we're in the same OS boot, do NOT allow any
      // fallback that would push us into Projects. After OS reboot we must require login.
      if (isAuthed) {
        const osBootId = safeGetItem("sairyne_os_boot_id");
        const lastOsBootId = safeGetItem("sairyne_last_os_boot_id");

        // If os boot id hasn't arrived yet, hold on Sign In and wait.
        if (!osBootId) {
          setIsOsGatePending(true);
          if (currentStep !== "SignIn") {
            setHistory([]);
            setCurrentStep("SignIn");
          }
          return;
        }

        // Baseline not loaded yet -> request it and wait (do NOT clear auth).
        if (lastOsBootId == null) {
          setIsOsGatePending(true);
          try {
            if (typeof window !== "undefined" && (window as any).loadFromJuce) {
              (window as any).loadFromJuce("sairyne_last_os_boot_id");
            }
          } catch {}
          if (currentStep !== "SignIn") {
            setHistory([]);
            setCurrentStep("SignIn");
          }
          return;
        }

        // Baseline explicitly missing -> sign out and require login.
        // IMPORTANT: do NOT clear the token just because baseline is missing.
        // We still require Sign In UI, but we keep persisted auth intact.
        if (lastOsBootId === TOMBSTONE) {
          forceProjectsRef.current = false;
          manualStayOnProjectsRef.current = false;
          manualStayOnSignInRef.current = false;
          bootHandledRef.current = true;
          setHistory([]);
          setCurrentStep("SignIn");
          setIsOsGatePending(false);
          return;
        }

        // Reboot detected -> sign out and require login.
        if (osBootId !== lastOsBootId) {
          clearAuthAndProject(osBootId);
          forceProjectsRef.current = false;
          manualStayOnProjectsRef.current = false;
          manualStayOnSignInRef.current = false;
          bootHandledRef.current = true;
          setHistory([]);
          setCurrentStep("SignIn");
          setIsOsGatePending(false);
          return;
        }

        // Gate passed
        setIsOsGatePending(false);
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
    // Debug marker to confirm the plugin loaded the latest Vercel build (shows up in Sairyne.log).
    try {
      if (isEmbedded) safeSetItem(BUILD_KEY, BUILD_TAG);
    } catch {}

    // Try immediately (may still be before JUCE inject), then retry when data arrives.
    tryAutoBootstrap();

    const onDataLoaded = () => tryAutoBootstrap();

    if (typeof window !== "undefined") {
      window.addEventListener("sairyne-init-loaded", onDataLoaded as any);
      window.addEventListener("sairyne-data-loaded", onDataLoaded as any);
    }

    // Small retry window to handle AU timing / slow init.
    // IMPORTANT: In embedded JUCE hosts, polling can cause step thrash while keys are still injecting,
    // which in turn spams persistence and can lead to WebView reload/freeze. Prefer event-driven retries.
    const t = isEmbedded ? null : window.setInterval(() => tryAutoBootstrap(), 600);
    const stop = isEmbedded ? null : window.setTimeout(() => window.clearInterval(t as any), 6000);

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("sairyne-init-loaded", onDataLoaded as any);
        window.removeEventListener("sairyne-data-loaded", onDataLoaded as any);
      }
      if (t) window.clearInterval(t as any);
      if (stop) window.clearTimeout(stop as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global cursor spinner while OS-gate is pending.
  useEffect(() => {
    setGlobalLoading("os-gate", isOsGatePending);
    return () => setGlobalLoading("os-gate", false);
  }, [isOsGatePending]);

  // Persist last visible screen so reopening the plugin window resumes the same UI (projects vs chat).
  useEffect(() => {
    try {
      // Never persist "SignIn" as last step automatically; it can create sticky loops.
      // If user intentionally wants to stay on Sign In, we use PIN_SIGNIN_KEY instead.
      if (currentStep === "SignIn") return;
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
        // Leaving Sign In via normal flow means "unpinned".
        safeSetItem(PIN_SIGNIN_KEY, TOMBSTONE);
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
      safeSetItem(PIN_SIGNIN_KEY, "1");
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
      {isOsGatePending ? (
        <div style={{ color: "#ffffffb3", fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 14 }}>
          Loading…
        </div>
      ) : (
        <ScreenComponent onNext={onNext} onBack={onBack} />
      )}
    </div>
  );
}
