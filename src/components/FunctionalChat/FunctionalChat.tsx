import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { Frame } from "../Frame";
import { ChatMessage } from "../ChatMessage";
import { ChatButton } from "../ChatButton";
import { SidebarMenu } from "../SidebarMenu";
import { LearnMode } from "../../screens/LearnMode";
import { AnalysisWarning } from "../AnalysisWarning";
import { Step3Content } from "../Step3Content";
import { VisualTips } from "../VisualTips";
import { ProjectAnalysis } from "../ProjectAnalysis";
import { AnalysingChannels } from "../AnalysingChannels";
import { AnalysisSummary } from "../AnalysisSummary";
import { FixIssuesChat } from "../FixIssuesChat";
import AnalysisPopup from "../AnalysisPopup";
import { ErrorBoundary } from "../ErrorBoundary";
import { createChatSteps } from "../../data/chatSteps";
import { WINDOW, ANIMATION } from "../../constants/dimensions";
import { ChatService } from "../../services/chatService";
import closeIcon from '../../assets/img/vector.svg';
import { resolveIsEmbedded } from "../../utils/embed";
import { AnalyticsService } from "../../services/analyticsService";
import { getSelectedProject } from "../../services/projects";
import { getActiveUserEmail } from "../../services/auth";
import { safeGetItem, safeSetItem } from "../../utils/storage";
import { safeJsonParse } from "../../utils/safeJson";
import { setPluginExpanded } from "../../services/audio/juceBridge";
import { setGlobalLoading } from "../../services/loadingService";

const SEND_ICON = "https://c.animaapp.com/hOiZ2IT6/img/frame-13-1.svg";
const ANALYSIS_ICON = "https://c.animaapp.com/hOiZ2IT6/img/waveform-light-1-1.svg";
const LEARN_ICON = "https://c.animaapp.com/hOiZ2IT6/img/stack-1-1.svg";
const CARET_ICON = "https://c.animaapp.com/hOiZ2IT6/img/polygon-1-2.svg";
const IS_DEV = Boolean((import.meta as any)?.env?.DEV);

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: number;
  isTyping?: boolean;
  isThinking?: boolean;
}

// Мемоизированный компонент для чата
const ChatContainer = React.memo(({ 
  messages, 
  showOptions, 
  showGenres, 
  showReadyButton, 
  showStepContent: _showStepContent, 
  showCompletedStep,
  currentStep,
  readyButtonHighlighted: _readyButtonHighlighted,
  completedStepText,
  onOptionClick,
  onGenreClick: _onGenreClick,
  onReadyClick: _onReadyClick,
  onVisualTipsToggle: _onVisualTipsToggle,
  showVisualTips,
  isTogglingVisualTips,
  chatContainerRef,
  onCompletedNextStep,
  showStep3Content,
  chatSteps,
  selectedLearnLevel
}: {
  messages: Message[];
  showOptions: boolean;
  showGenres: boolean;
  showReadyButton: boolean;
  showStepContent: boolean;
  showCompletedStep: boolean;
  currentStep: number;
  readyButtonHighlighted: boolean;
  completedStepText: string;
  onOptionClick: (option: string) => void;
  onGenreClick: (genre: string) => void;
  onReadyClick: () => void;
  onVisualTipsToggle: () => void;
  showVisualTips: boolean;
  isTogglingVisualTips: boolean;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  onCompletedNextStep: () => void;
  showStep3Content: boolean;
  chatSteps: any[];
  selectedLearnLevel: string;
}) => {
  return (
        <div 
          ref={chatContainerRef} 
          className="absolute top-[50px] left-[10px] bottom-[140px] overflow-y-auto"
          style={{ 
            scrollBehavior: isTogglingVisualTips ? 'auto' : 'smooth',
            width: showVisualTips ? '357px' : '357px',
            transition: isTogglingVisualTips ? 'none' : 'width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            backgroundColor: 'rgba(110, 36, 171, 0.05)',
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(110, 36, 171, 0.08), transparent 70%)'
          }}
        >
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message.content}
          isTyping={message.isTyping}
          isThinking={message.isThinking}
          isUser={message.type === 'user'}
        />
      ))}



      {/* Опции из данных шагов */}
      {(() => {
        // В Pro Mode не показываем статичные опции
        if (selectedLearnLevel === 'pro') return null;
        
        const currentStepData = chatSteps.find(step => step.id === currentStep);
        if (currentStepData && currentStepData.options) {
          // Показываем опции только если AI закончил печатать
          const shouldShowOptions = showOptions || showGenres || showReadyButton;
          if (!shouldShowOptions) return null;
          
          return (
            <div className="flex flex-col gap-3 items-end mb-3">
              {currentStepData.options.map((option: string) => (
                <ChatButton
                  key={option}
                  text={option === "Show visual tips" ? (showVisualTips ? "Hide visual tips" : "Show visual tips") : option}
                  onClick={() => onOptionClick(option)}
                  variant="option"
                  isVisible={true}
                  className="animate-fadeIn"
                />
              ))}
            </div>
          );
        }
        return null;
      })()}






      {/* Кнопка "Completed. Next step." */}
      {showCompletedStep && (
        <div className="flex justify-end mb-3">
          <ChatButton
            text={completedStepText}
            onClick={onCompletedNextStep}
            variant="primary"
            className="w-[298px] animate-fadeIn"
          />
        </div>
      )}

      {/* Step 3 Content - Project Analysis */}
      {showStep3Content && (
        <div className="mt-4">
          <Step3Content />
        </div>
      )}
    </div>
  );
});

interface FunctionalChatProps {
  onBack?: () => void;
}

export const FunctionalChat = ({ onBack }: FunctionalChatProps = {}): JSX.Element => {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const lastSendAtRef = useRef(0);
  const aiRequestInFlightRef = useRef(false);
  const lastPersistAtRef = useRef(0);
  const learnAnalysisSeqRef = useRef(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [projectName, setProjectName] = useState("New Project");
  const [userInput, setUserInput] = useState("");
  const [isProjectSessionReady, setIsProjectSessionReady] = useState(false);
  
  const [showOptions, setShowOptions] = useState(false);
  const [showGenres, setShowGenres] = useState(false);
  const [showReadyButton, setShowReadyButton] = useState(false);
  const [readyButtonHighlighted, setReadyButtonHighlighted] = useState(false);
  const [, setReadyButtonClicked] = useState(false);
  const [showStepContent, setShowStepContent] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCompletedStep, setShowCompletedStep] = useState(false);
  const [completedStepText, setCompletedStepText] = useState("");
  const [showLearnMode, setShowLearnMode] = useState(false);
  const [selectedLearnLevel, setSelectedLearnLevel] = useState("learn");
  const MODE_KEY = 'sairyne_chat_mode_v1';
  const lastModeWriteAtRef = useRef(0);
  // Track per-session mode initialization to avoid repeatedly resetting mode (learn/pro ping-pong)
  const modeInitializedRef = useRef<Record<string, boolean>>({});
  // When hydration forces Pro (because messages exist), prevent storage from overwriting back to Learn/Create.
  const forcedProHydrateRef = useRef(false);
  const [learnModeAIActive, setLearnModeAIActive] = useState(false); // Флаг для AI диалога в Learn mode
  const [showVisualTips, setShowVisualTips] = useState(false);
  const [showProjectAnalysis, setShowProjectAnalysis] = useState(false);
  const [showAnalysingChannels, setShowAnalysingChannels] = useState(false);
  const [showAnalysisWarning, setShowAnalysisWarning] = useState(false);
  const [showAnalysisSummary, setShowAnalysisSummary] = useState(false);
  const [showFixIssuesChat, setShowFixIssuesChat] = useState(false);
  const [showStep3Content] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [hasCompletedAnalysis, setHasCompletedAnalysis] = useState(false);
  const [showAnalysisPopup, setShowAnalysisPopup] = useState(false);
  const [isOffline, setIsOffline] = useState(() => {
    if (IS_DEV) return false;
    if (typeof navigator === 'undefined') return false;
    return !navigator.onLine;
  });
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [lastOnlineCheck, setLastOnlineCheck] = useState<number | null>(null);
  const [isInterfaceReady, setIsInterfaceReady] = useState(false);
  const isEmbedded = resolveIsEmbedded();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  // Prevent the "first workflow prompt" from flashing before persisted state is hydrated.
  const [isHydrationGateReady, setIsHydrationGateReady] = useState(false);
  const hydrationTimerRef = useRef<number | null>(null);
  const expectingHydrationRef = useRef(false);
  const [isTogglingVisualTips, setIsTogglingVisualTips] = useState(false);
  const savedScrollPositionRef = useRef<number>(0);
  const analysisTimeoutRef = useRef<number | null>(null);
  // Persist scroll position even when user only scrolls (no new messages).
  const scrollDebounceTimerRef = useRef<number | null>(null);
  const persistChatStateNowRef = useRef<((opts?: { force?: boolean }) => void) | null>(null);
  // Restore scroll reliably: WKWebView/React can clamp scrollTop to 0 if we set it before layout is ready.
  const pendingInitialScrollRef = useRef<number | null>(null);
  const scrollRestoreTimerRef = useRef<number | null>(null);
  const scrollRestoreAttemptsRef = useRef(0);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Global cursor spinner for "wait" states in chat (AI thinking / reconnecting / hydration).
  useEffect(() => {
    const hasThinking = messages.some((m) => (m as any)?.isThinking) || aiRequestInFlightRef.current;
    setGlobalLoading("chat-ai", hasThinking);
    return () => setGlobalLoading("chat-ai", false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  useEffect(() => {
    setGlobalLoading("chat-reconnect", isCheckingHealth);
    return () => setGlobalLoading("chat-reconnect", false);
  }, [isCheckingHealth]);

  useEffect(() => {
    const pendingHydration = Boolean(isProjectSessionReady && !isHydrationGateReady);
    setGlobalLoading("chat-hydration", pendingHydration);
    return () => setGlobalLoading("chat-hydration", false);
  }, [isProjectSessionReady, isHydrationGateReady]);
  
  // Сохранение состояния для каждого режима
  interface ModeState {
    messages: Message[];
    currentStep: number;
    scrollPosition: number;
    showOptions: boolean;
    showGenres: boolean;
    showReadyButton: boolean;
    showCompletedStep: boolean;
    completedStepText: string;
  }
  const modeStatesRef = useRef<Record<string, ModeState>>({
    learn: { messages: [], currentStep: 0, scrollPosition: 0, showOptions: false, showGenres: false, showReadyButton: false, showCompletedStep: false, completedStepText: "" },
    create: { messages: [], currentStep: 0, scrollPosition: 0, showOptions: false, showGenres: false, showReadyButton: false, showCompletedStep: false, completedStepText: "" },
    pro: { messages: [], currentStep: 0, scrollPosition: 0, showOptions: false, showGenres: false, showReadyButton: false, showCompletedStep: false, completedStepText: "" }
  });
  const previousModeRef = useRef<string>(selectedLearnLevel);

  const CHAT_STATE_KEY = 'sairyne_functional_chat_state_v1';
  const MAX_MESSAGES_PER_MODE = 200;
  const TOMBSTONE = '0';
  const resolveActiveSessionKey = () => {
    const selected = getSelectedProject();
    // If no project selected yet, do NOT reuse any previous chat session.
    if (!selected || typeof selected.id !== 'number') return null;
    // Prefer project ownerEmail (stable even if current user data hasn't hydrated yet).
    const ownerEmail = (selected as any)?.ownerEmail || getActiveUserEmail();
    return `${ownerEmail}:${selected.id}`;
  };

  const lastSessionKeyRef = useRef<string | null>(null);
  const hasPersistedMessagesForSession = useCallback((sessionKey: string | null): boolean | null => {
    if (!sessionKey) return null;
    try {
      const raw = safeGetItem(CHAT_STATE_KEY);
      if (!raw) return null; // unknown (may still be loading from JUCE)
      if (raw === TOMBSTONE) return false;
      const parsed = safeJsonParse<any>(raw, null);
      if (!parsed || typeof parsed !== 'object') return false;
      const hasSessions = parsed.sessions && typeof parsed.sessions === 'object';
      if (!hasSessions) return false;
      const session = parsed.sessions?.[sessionKey];
      if (!session || typeof session !== 'object') return false;
      const modeStates = session.modeStates;
      if (!modeStates || typeof modeStates !== 'object') return false;
      const countNonEmpty = (arr: any) =>
        Array.isArray(arr) ? arr.filter((m: any) => typeof m?.content === 'string' && m.content.trim().length > 0).length : 0;
      const any =
        countNonEmpty(modeStates.learn?.messages) > 0 ||
        countNonEmpty(modeStates.create?.messages) > 0 ||
        countNonEmpty(modeStates.pro?.messages) > 0;
      return any;
    } catch {
      return null;
    }
  }, []);

  const startHydrationGate = useCallback((sessionKey: string | null) => {
    if (hydrationTimerRef.current) {
      window.clearTimeout(hydrationTimerRef.current);
      hydrationTimerRef.current = null;
    }
    // If no session key (no project selected), keep gate closed.
    if (!sessionKey) {
      setIsHydrationGateReady(false);
      expectingHydrationRef.current = false;
      return;
    }
    // Deterministic gate:
    // - If we already know there are persisted messages for this session, DO NOT open by timeout.
    //   Wait until hydration succeeds (prevents "flash then disappear").
    // - If we know there are no messages, open quickly.
    // - If unknown (chat state not loaded yet), wait a bit longer for JUCE to inject; then open.
    const hasPersisted = hasPersistedMessagesForSession(sessionKey);
    setIsHydrationGateReady(false);
    if (hasPersisted === true) {
      expectingHydrationRef.current = true;
      return;
    }
    expectingHydrationRef.current = false;
    const waitMs = hasPersisted === false ? 150 : 2800;
    hydrationTimerRef.current = window.setTimeout(() => {
      setIsHydrationGateReady(true);
    }, waitMs);
  }, [hasPersistedMessagesForSession]);

  // In embedded plugin: new project sessions should start in Learn mode by default.
  // If this project session has no persisted messages, reset mode to 'learn' (even if last session was 'pro').
  useEffect(() => {
    if (!isEmbedded) return;
    const sessionKey = resolveActiveSessionKey();
    if (!sessionKey) return;
    const modeKey = `${MODE_KEY}:${sessionKey}`;
    const apply = (raw: string | null) => {
      const v = String(raw || '').trim();
      if (v === 'learn' || v === 'create' || v === 'pro') {
        if (forcedProHydrateRef.current && v !== 'pro') return;
        // Ignore stale remote writes that arrive immediately after a local change.
        if (lastModeWriteAtRef.current && Date.now() - lastModeWriteAtRef.current < 1500) return;
        modeInitializedRef.current[sessionKey] = true;
        previousModeRef.current = v;
        setSelectedLearnLevel(v);
      }
    };
    try {
      apply(safeGetItem(modeKey));
    } catch {}
    const onDataLoaded = (e: any) => {
      try {
        if (e?.detail?.key === modeKey) apply(e.detail.value);
      } catch {}
    };
    try {
      window.addEventListener('sairyne-data-loaded', onDataLoaded as any);
    } catch {}
    return () => {
      try {
        window.removeEventListener('sairyne-data-loaded', onDataLoaded as any);
      } catch {}
    };
  }, [isEmbedded, resolveActiveSessionKey]);

  // Ensure new project sessions start in Learn if they have no messages.
  useEffect(() => {
    if (!isEmbedded) return;
    const sessionKey = resolveActiveSessionKey();
    if (!sessionKey) return;
    const hasPersisted = hasPersistedMessagesForSession(sessionKey);
    if (hasPersisted === false && !modeInitializedRef.current[sessionKey]) {
      if (forcedProHydrateRef.current) {
        return;
      }
      if (previousModeRef.current !== 'learn') {
        previousModeRef.current = 'learn';
        setSelectedLearnLevel('learn');
        try {
          safeSetItem(`${MODE_KEY}:${sessionKey}`, 'learn');
        } catch {}
      }
      modeInitializedRef.current[sessionKey] = true;
    }
  }, [isEmbedded, hasPersistedMessagesForSession, resolveActiveSessionKey]);

  const resetUiToBlankSession = useCallback(() => {
    // Reset in-memory UI state so switching projects doesn't reuse previous project's chat
    const emptyModeStates: Record<string, ModeState> = {
      learn: { messages: [], currentStep: 0, scrollPosition: 0, showOptions: false, showGenres: false, showReadyButton: false, showCompletedStep: false, completedStepText: "" },
      create: { messages: [], currentStep: 0, scrollPosition: 0, showOptions: false, showGenres: false, showReadyButton: false, showCompletedStep: false, completedStepText: "" },
      pro: { messages: [], currentStep: 0, scrollPosition: 0, showOptions: false, showGenres: false, showReadyButton: false, showCompletedStep: false, completedStepText: "" },
    };
    modeStatesRef.current = emptyModeStates as any;
    previousModeRef.current = 'learn';
    setSelectedLearnLevel('learn');
    setMessages([]);
    setCurrentStep(0);
    setShowOptions(false);
    setShowGenres(false);
    setShowReadyButton(false);
    setShowCompletedStep(false);
    setCompletedStepText("");
    setCompletedSteps(0);
    setHasCompletedAnalysis(false);
    isInitializedRef.current = false;
  }, []);

  const sanitizeMessages = (msgs: Message[]): Message[] =>
    msgs
      .filter((m) => typeof m?.content === 'string' && m.content.trim().length > 0)
      .map((m) => ({
        ...m,
        isVisible: true,
        isTyping: false,
      }));

  const trimMessages = (msgs: Message[]): Message[] => {
    if (!Array.isArray(msgs)) return [];
    if (msgs.length <= MAX_MESSAGES_PER_MODE) return msgs;
    // Keep the most recent messages to cap storage size
    return msgs.slice(msgs.length - MAX_MESSAGES_PER_MODE);
  };

  const scheduleReliableScrollRestore = useCallback((target: number) => {
    pendingInitialScrollRef.current = Math.max(0, Number.isFinite(target) ? target : 0);
    scrollRestoreAttemptsRef.current = 0;

    const tick = () => {
      const el = chatContainerRef.current;
      const desired = pendingInitialScrollRef.current;
      if (desired == null) return;
      // If the container isn't mounted yet, keep retrying briefly.
      if (!el) {
        scrollRestoreAttemptsRef.current += 1;
        if (scrollRestoreAttemptsRef.current >= 20) {
          pendingInitialScrollRef.current = null;
          if (scrollRestoreTimerRef.current) window.clearTimeout(scrollRestoreTimerRef.current);
          scrollRestoreTimerRef.current = null;
          return;
        }
        scrollRestoreTimerRef.current = window.setTimeout(tick, 50);
        return;
      }

      const max = Math.max(0, el.scrollHeight - el.clientHeight);
      // IMPORTANT: On initial mount, max can be 0 (content not laid out yet).
      // If desired > 0 but max < desired, we must keep retrying; otherwise we'll "succeed" at 0 and stop,
      // which is exactly the bug you're seeing (chat always opens at top).
      const canReachDesired = max >= desired;
      const targetScrollTop = canReachDesired ? desired : max;
      el.scrollTop = targetScrollTop;

      const closeEnough = canReachDesired && Math.abs(el.scrollTop - desired) <= 2;
      scrollRestoreAttemptsRef.current += 1;

      if (closeEnough || scrollRestoreAttemptsRef.current >= 20) {
        pendingInitialScrollRef.current = null;
        if (scrollRestoreTimerRef.current) window.clearTimeout(scrollRestoreTimerRef.current);
        scrollRestoreTimerRef.current = null;
        return;
      }

      scrollRestoreTimerRef.current = window.setTimeout(tick, 50);
    };

    if (scrollRestoreTimerRef.current) window.clearTimeout(scrollRestoreTimerRef.current);
    scrollRestoreTimerRef.current = window.setTimeout(tick, 0);
  }, []);

  const tryHydrateFromStorage = useCallback(() => {
    try {
      try {
        const sessionKey = resolveActiveSessionKey();
        const msg = `[FunctionalChat] TRY_HYDRATE sessionKey=${sessionKey || 'null'}`;
        console.log(msg);
        try {
          (window as any)?.__JUCE__?.backend?.emitEvent?.('debugLog', { message: msg });
        } catch {}
      } catch {}

      const raw = safeGetItem(CHAT_STATE_KEY);
      if (!raw || raw === TOMBSTONE) return false;
      // Guardrail: if chat state is corrupted/too large, reset only this key.
      if (raw.length > 350_000) {
        // NOTE: JUCE persistence rejects empty values; use tombstone for "clearing".
        safeSetItem(CHAT_STATE_KEY, TOMBSTONE);
        return false;
      }
      const parsed = safeJsonParse<any>(raw, null);
      if (!parsed || typeof parsed !== 'object') return false;
      // v2+: per-project sessions
      const sessionKey = resolveActiveSessionKey();
      let resolvedSessionKey = sessionKey;
      try {
        const keys = parsed?.sessions ? Object.keys(parsed.sessions) : [];
        const line = `HYDRATE_SESSION | sessionKey=${resolvedSessionKey || sessionKey || 'null'} | sessions=${keys.join(',')}`;
        console.log('[FunctionalChat]', line);
        try {
          (window as any)?.__JUCE__?.backend?.emitEvent?.('debugLog', { message: line });
        } catch {}
      } catch {}
      const hasSessions = parsed.sessions && typeof parsed.sessions === 'object';
      let session = sessionKey && hasSessions ? parsed.sessions[sessionKey] : null;

      // If current project session is missing, bail out (wait for next inject) instead of creating empty.
      if (hasSessions && sessionKey && !session) {
        return false;
      }

      try {
        const effectiveForLog = session && typeof session === 'object' ? session : parsed;
        const modeStates = effectiveForLog?.modeStates || {};
        const dbg = ['HYDRATE_DEBUG'];
        ['learn', 'create', 'pro'].forEach((m) => {
          const list = modeStates?.[m]?.messages;
          const last = Array.isArray(list) && list.length > 0 ? list[list.length - 1] : null;
          const preview =
            last && typeof last.content === 'string'
              ? last.content.slice(0, 120).replace(/\s+/g, ' ')
              : '';
          dbg.push(`${m}: ${Array.isArray(list) ? list.length : 0} last="${preview}"`);
        });
        const line = dbg.join(' | ');
        console.log('[FunctionalChat]', line);
        try {
          (window as any)?.__JUCE__?.backend?.emitEvent?.('debugLog', { message: line });
        } catch {}
      } catch {}

      // If we have per-project sessions but no project selected yet, do not hydrate anything.
      // This avoids accidentally showing the last opened project's chat for every project.
      if (hasSessions && !resolvedSessionKey) {
        return false;
      }

      // Backward-compat: old format (no sessions) treated as current session (will be migrated on next save)
      const effective = session && typeof session === 'object' ? session : parsed;
      const pending = effective && typeof effective === 'object' ? (effective as any).pendingAi : null;
      // If pendingAi has a finished response, materialize it into messages so we don't lose it on reopen.
      let pendingResponse: { mode?: string; text?: string } | null = null;
      if (pending && typeof pending === 'object') {
        const text = (pending as any).responseText;
        if (typeof text === 'string' && text.trim().length > 0) {
          pendingResponse = { mode: (pending as any).mode as any, text };
        }
        try {
          delete (effective as any).pendingAi;
        } catch {}
      }

      if (typeof effective.selectedLearnLevel === 'string') {
        setSelectedLearnLevel(effective.selectedLearnLevel);
        previousModeRef.current = effective.selectedLearnLevel;
      }

      if (typeof effective.completedSteps === 'number') setCompletedSteps(effective.completedSteps);
      if (typeof effective.hasCompletedAnalysis === 'boolean') setHasCompletedAnalysis(effective.hasCompletedAnalysis);

      // Restore mode states
      if (effective.modeStates && typeof effective.modeStates === 'object') {
        const restored: any = {};
        ['learn', 'create', 'pro'].forEach((mode) => {
          const st = effective.modeStates[mode];
          if (st && typeof st === 'object') {
            restored[mode] = {
              messages: Array.isArray(st.messages) ? sanitizeMessages(st.messages) : [],
              currentStep: typeof st.currentStep === 'number' ? st.currentStep : 0,
              scrollPosition: typeof st.scrollPosition === 'number' ? st.scrollPosition : 0,
              showOptions: !!st.showOptions,
              showGenres: !!st.showGenres,
              showReadyButton: !!st.showReadyButton,
              showCompletedStep: !!st.showCompletedStep,
              completedStepText: typeof st.completedStepText === 'string' ? st.completedStepText : '',
            };
          }
        });
        if (Object.keys(restored).length > 0) {
          modeStatesRef.current = {
            learn: restored.learn ?? modeStatesRef.current.learn,
            create: restored.create ?? modeStatesRef.current.create,
            pro: restored.pro ?? modeStatesRef.current.pro,
          };
        }
      }

      // If we had a pending AI response, append it to the corresponding mode messages so it renders after reopen.
      if (pendingResponse && pendingResponse.text) {
        const targetMode = pendingResponse.mode || previousModeRef.current || selectedLearnLevel || 'pro';
        const existing = modeStatesRef.current[targetMode] || { messages: [] };
        const merged = {
          ...existing,
          messages: [
            ...(Array.isArray(existing.messages) ? existing.messages : []),
            {
              id: `ai-pending-${Date.now()}`,
              type: 'ai',
              content: pendingResponse.text,
              timestamp: Date.now(),
              isTyping: false,
              isThinking: false,
            } as Message,
          ],
        };
        modeStatesRef.current = {
          ...modeStatesRef.current,
          [targetMode]: merged,
        };
      }

      // If Pro has messages, force UI to Pro and show them immediately.
      try {
        const proState = modeStatesRef.current.pro;
        const proCount = proState?.messages?.length || 0;
        if (proCount > 0) {
          previousModeRef.current = 'pro';
          forcedProHydrateRef.current = true;
          setSelectedLearnLevel('pro');
          setMessages([...(proState.messages || [])]);
          setCurrentStep(proState.currentStep || 0);
          setShowOptions(!!proState.showOptions);
          setShowGenres(!!proState.showGenres);
          setShowReadyButton(!!proState.showReadyButton);
          setShowCompletedStep(!!proState.showCompletedStep);
          setCompletedStepText(proState.completedStepText || '');
          if (proState.messages && proState.messages.length > 0) {
            isInitializedRef.current = true;
          }
          scheduleReliableScrollRestore(proState.scrollPosition ?? 0);
          try {
            lastSessionKeyRef.current = resolvedSessionKey || sessionKey || lastSessionKeyRef.current;
            setIsProjectSessionReady(true);
            setIsHydrationGateReady(true);
          } catch {}
          return true;
        }
      } catch {}

      // Apply current mode state to UI
      const active = previousModeRef.current || 'learn';
      const savedState = modeStatesRef.current[active];
      if (savedState) {
        setMessages([...savedState.messages]);
        setCurrentStep(savedState.currentStep);
        setShowOptions(savedState.showOptions);
        setShowGenres(savedState.showGenres);
        setShowReadyButton(savedState.showReadyButton);
        setShowCompletedStep(savedState.showCompletedStep);
        setCompletedStepText(savedState.completedStepText);

        // Prevent re-sending the initial "workflow start" message on reopen.
        if (savedState.messages && savedState.messages.length > 0) {
          isInitializedRef.current = true;
        }

        // Restore scroll reliably (may require waiting for DOM/layout)
        scheduleReliableScrollRestore(savedState.scrollPosition ?? 0);

        // After restoring messages, immediately persist to capture this snapshot (including last message).
        if (savedState.messages && savedState.messages.length > 0) {
          try {
            persistChatStateNowRef.current?.({ force: true });
          } catch {}
        }
      }

      // If still no messages in UI but some mode has messages, pick the mode with most messages and apply it.
      try {
        if (messagesRef.current.length === 0) {
          const modes = ['pro', 'create', 'learn'] as const;
          const best = modes
            .map((m) => ({ m, count: modeStatesRef.current[m]?.messages?.length || 0 }))
            .sort((a, b) => b.count - a.count)[0];
          if (best && best.count > 0) {
            const st = modeStatesRef.current[best.m];
            previousModeRef.current = best.m;
            forcedProHydrateRef.current = forcedProHydrateRef.current || best.m === 'pro';
            setSelectedLearnLevel(best.m);
            setMessages([...(st.messages || [])]);
            setCurrentStep(st.currentStep || 0);
            setShowOptions(!!st.showOptions);
            setShowGenres(!!st.showGenres);
            setShowReadyButton(!!st.showReadyButton);
            setShowCompletedStep(!!st.showCompletedStep);
            setCompletedStepText(st.completedStepText || '');
            isInitializedRef.current = true;
            scheduleReliableScrollRestore(st.scrollPosition ?? 0);
            try {
              persistChatStateNowRef.current?.({ force: true });
            } catch {}
          }
        }
      } catch {}

      try {
        setIsProjectSessionReady(true);
        setIsHydrationGateReady(true);
      } catch {}

      return true;
    } catch (e) {
      console.warn('[FunctionalChat] Failed to hydrate chat state:', e);
      return false;
    }
  }, [scheduleReliableScrollRestore]);

  // Инициализация состояния для текущего режима при первом рендере
  useEffect(() => {
    // 1) Try hydrate chat state early
    const initialKey = resolveActiveSessionKey();
    lastSessionKeyRef.current = initialKey;
    setIsProjectSessionReady(Boolean(initialKey));
    startHydrationGate(initialKey);
    // Only attempt hydrate when we know which project's session we are in
    if (initialKey) {
      const ok = tryHydrateFromStorage();
      // If we successfully hydrated, we can open the gate immediately.
      if (ok) setIsHydrationGateReady(true);
    }

    // 2) If data arrives from JUCE later, re-hydrate once
    const onDataLoaded = (e: any) => {
      const key = e?.detail?.key;
      if (key === CHAT_STATE_KEY || key === 'sairyne_selected_project' || key === 'sairyne_projects') {
        // IMPORTANT: avoid clobbering in-flight UI messages.
        // We only need to rehydrate on initial JUCE inject / project switching, not on every local safeSetItem write.
        if (
          key === CHAT_STATE_KEY &&
          isInitializedRef.current &&
          messagesRef.current.length > 0 &&
          !expectingHydrationRef.current
        ) {
          return;
        }

        // If selected project changed, reset to blank BEFORE hydrating.
        const nextSessionKey = resolveActiveSessionKey();
        setIsProjectSessionReady(Boolean(nextSessionKey));
        if (nextSessionKey && nextSessionKey !== lastSessionKeyRef.current) {
          lastSessionKeyRef.current = nextSessionKey;
          resetUiToBlankSession();
          startHydrationGate(nextSessionKey);
        }

        // Only hydrate when we have a project session key.
        if (nextSessionKey) {
          const ok = tryHydrateFromStorage();
          if (ok) {
            expectingHydrationRef.current = false;
            setIsHydrationGateReady(true);
          }
        }
          // If we are expecting hydration (persisted messages exist), keep the gate closed
          // until hydration succeeds. This prevents "first prompt" flicker.
          if (nextSessionKey && expectingHydrationRef.current) {
            const hasPersisted = hasPersistedMessagesForSession(nextSessionKey);
            if (hasPersisted === true) {
              setIsHydrationGateReady(false);
            } else if (hasPersisted === false) {
              expectingHydrationRef.current = false;
              setIsHydrationGateReady(true);
            }
          }
        // Also refresh project name when selected project data arrives late
        const selectedProject = getSelectedProject();
        if (selectedProject?.name) {
          setProjectName(selectedProject.name);
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('sairyne-data-loaded', onDataLoaded as any);
    }

    const savedState = modeStatesRef.current[selectedLearnLevel];
    if (savedState && savedState.messages.length > 0) {
      setMessages([...savedState.messages]);
      setCurrentStep(savedState.currentStep);
      setShowOptions(savedState.showOptions);
      setShowGenres(savedState.showGenres);
      setShowReadyButton(savedState.showReadyButton);
      setShowCompletedStep(savedState.showCompletedStep);
      setCompletedStepText(savedState.completedStepText);
    }
    previousModeRef.current = selectedLearnLevel;
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('sairyne-data-loaded', onDataLoaded as any);
      }
      if (hydrationTimerRef.current) {
        window.clearTimeout(hydrationTimerRef.current);
        hydrationTimerRef.current = null;
      }
    };
  }, []); // Только при монтировании

  // Restore last selected chat mode:
  // - In browser: use global key.
  // - In embedded: use global key ONLY when there is no active project session yet
  //   (e.g., before user selects/creates a project). Once a project is selected,
  //   per-session mode is handled by the session effect below.
  useEffect(() => {
    const apply = (raw: string | null) => {
      const v = String(raw || '').trim();
      if (v === 'learn' || v === 'create' || v === 'pro') {
        previousModeRef.current = v;
        setSelectedLearnLevel(v);
      }
    };
    const sessionKey = isEmbedded ? resolveActiveSessionKey() : null;
    // Skip global restore when embedded and a project session exists.
    if (isEmbedded && sessionKey) return;
    try {
      apply(safeGetItem(MODE_KEY));
    } catch {}
    const onDataLoaded = (e: any) => {
      try {
        if (e?.detail?.key === MODE_KEY) apply(e.detail.value);
      } catch {}
    };
    try {
      window.addEventListener('sairyne-data-loaded', onDataLoaded as any);
      return () => window.removeEventListener('sairyne-data-loaded', onDataLoaded as any);
    } catch {
      return;
    }
  }, [isEmbedded, resolveActiveSessionKey]);

  // Scroll to show new AI message once, then let user scroll manually (like ChatGPT)
  const scrollToNewMessage = () => {
    if (chatContainerRef.current) {
      // Wait for DOM to update before scrolling (50ms delay)
      setTimeout(() => {
        if (chatContainerRef.current) {
          const container = chatContainerRef.current;
          const targetScroll = container.scrollHeight - container.clientHeight;
          container.scrollTop = targetScroll; // Instant scroll, one time only
        }
      }, 50);
    }
  };

  // Add AI message with typing animation (MUST be declared before resumeLastRequest to avoid TDZ crash)
  const addAIMessage = useCallback((content: string, onComplete?: () => void, isThinking?: boolean) => {
    const message: Message = {
      id: `ai-${Date.now()}`,
      type: 'ai',
      content: '',
      timestamp: Date.now(),
      isTyping: true,
      isThinking
    };

    setMessages(prev => {
      const next = [...prev, message];
      const mode = selectedLearnLevel || previousModeRef.current || 'learn';
      const existing = modeStatesRef.current[mode] || {
        messages: [],
        currentStep: 0,
        scrollPosition: 0,
        showOptions: false,
        showGenres: false,
        showReadyButton: false,
        showCompletedStep: false,
        completedStepText: '',
      };
      modeStatesRef.current[mode] = {
        ...existing,
        messages: trimMessages(next),
      };
      return next;
    });
    // Scroll to the new message once when it appears
    scrollToNewMessage();

    // Split content into words and animate word-by-word
    const words = content.split(' ');
    let wordIndex = 0;

    const typeNextWord = () => {
      if (wordIndex < words.length) {
        const currentText = words.slice(0, wordIndex + 1).join(' ');
        setMessages(prev => prev.map(msg =>
          msg.id === message.id
            ? { ...msg, content: currentText }
            : msg
        ));
        wordIndex++;
        setTimeout(typeNextWord, 18);
      } else {
        setMessages(prev => prev.map(msg =>
          msg.id === message.id
            ? { ...msg, isTyping: false }
            : msg
        ));
        if (onComplete) {
          setTimeout(onComplete, 50);
        }
      }
    };

    setTimeout(typeNextWord, 50);
  }, []);

  // Resume AI requests that were in-flight when the plugin UI was closed.
  const resumeAttemptedRef = useRef<Record<string, boolean>>({});
  const mountedAtRef = useRef(Date.now());
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const resumeLastRequest = useCallback(() => {
    const sessionKey = resolveActiveSessionKey();
    if (!sessionKey) {
      setShowResumeBanner(false);
      return;
    }
    try {
      const raw = safeGetItem(CHAT_STATE_KEY);
      if (!raw) {
        setShowResumeBanner(false);
        return;
      }
      const root = safeJsonParse<any>(raw, null);
      const pending = root?.sessions?.[sessionKey]?.pendingAi;
      if (!pending) {
        setShowResumeBanner(false);
        return;
      }

      const thinkingId = String(pending.thinkingId || `ai-thinking-${Date.now()}`);

      // If we already have a received response, just render it again (no network).
      if (typeof pending.responseText === 'string' && pending.responseText.length > 0) {
        // IMPORTANT (Plugin stability): Do NOT re-run the word-by-word typing animation on reopen.
        // Large responses can freeze WKWebView/JUCE while we "re-type" them.
        const text = String(pending.responseText);
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: text,
          timestamp: Date.now(),
          isTyping: false,
          isThinking: false,
        };

        setMessages((prev) => {
          const cleaned = prev.filter((m) => !(m as any).isThinking && !(m as any).isTyping);
          return [...cleaned, aiMessage];
        });
        setTimeout(() => scrollToNewMessage(), 50);

        // Clear pendingAi immediately so we don't keep trying to "resume" the same response.
        try {
          const existing = safeGetItem(CHAT_STATE_KEY);
          if (existing) {
            const root2 = safeJsonParse<any>(existing, {}) || {};
            if (root2?.sessions?.[sessionKey]) {
              delete root2.sessions[sessionKey].pendingAi;
              safeSetItem(CHAT_STATE_KEY, JSON.stringify(root2));
            }
          }
        } catch {}

        setShowResumeBanner(false);
        return;
      }

      // Otherwise, retry the request.
      const messageText = String(pending.messageText || '');
      const mode = pending.mode as 'pro' | 'create' | 'learn';
      const conversationHistory = Array.isArray(pending.conversationHistory)
        ? pending.conversationHistory
        : messages
            .filter((msg) => {
              const isValid = !(msg as any).isThinking && !(msg as any).isTyping && msg.content.trim() !== '';
              const isNotSystem = msg.content !== "Completed. Next step." && !msg.content.includes("Completed.");
              return isValid && isNotSystem;
            })
            .map((msg) => ({ type: msg.type, content: msg.content }));

      setMessages((prev) => {
        const withoutThinking = prev.filter((m) => !(m as any).isThinking);
        return [...withoutThinking, { id: thinkingId, type: 'ai', content: '...', timestamp: Date.now(), isThinking: true } as any];
      });

      ChatService.sendMessage(messageText, conversationHistory, mode)
        .then((aiResponse) => {
          setMessages((prev) => prev.filter((m) => !(m as any).isThinking));
          addAIMessage(aiResponse, () => {
            try {
              const existing = safeGetItem(CHAT_STATE_KEY);
              if (existing) {
                const root2 = safeJsonParse<any>(existing, {}) || {};
                if (root2?.sessions?.[sessionKey]) {
                  delete root2.sessions[sessionKey].pendingAi;
                  safeSetItem(CHAT_STATE_KEY, JSON.stringify(root2));
                }
              }
            } catch {}
            // Resume succeeded; hide the banner.
            setShowResumeBanner(false);
          });
        })
        .catch(() => {
          setMessages((prev) => prev.filter((m) => !(m as any).isThinking));
          addAIMessage("Your previous request was interrupted. Click Resume to try again.");
        });
    } catch {}
  }, [addAIMessage, messages]);

  useEffect(() => {
    const sessionKey = resolveActiveSessionKey();
    if (!sessionKey) return;
    if (!isProjectSessionReady) return;
    if (resumeAttemptedRef.current[sessionKey]) return;
    // Don't auto-resume while a request is actively in-flight in this UI instance.
    if (aiRequestInFlightRef.current) return;

    try {
      const raw = safeGetItem(CHAT_STATE_KEY);
      if (!raw) return;
      const root = safeJsonParse<any>(raw, null);
      const pending = root?.sessions?.[sessionKey]?.pendingAi;
      if (!pending || typeof pending.messageText !== 'string' || typeof pending.mode !== 'string') return;

      // Only auto-resume requests that predate this UI mount.
      // We also persist `pendingAi` for *current* Pro requests; we must not treat those as "interrupted".
      if (typeof pending.startedAt === 'number' && pending.startedAt >= mountedAtRef.current - 1000) {
        return;
      }

      // Mark attempt so we don't loop.
      resumeAttemptedRef.current[sessionKey] = true;

      // Attempt auto-resume; if it still fails/hangs, user can use Resume button.
      setShowResumeBanner(true);
      resumeLastRequest();
    } catch {
      // ignore
    }
  }, [isProjectSessionReady, resumeLastRequest]);

  // Persist chat state (debounced) so AU/VST3 window reload doesn't wipe it
  const persistChatStateNow = useCallback((opts?: { force?: boolean }) => {
    const force = Boolean(opts?.force);
    const sessionKey = resolveActiveSessionKey();
    if (!sessionKey) return;
    try {
      const line = `PERSIST_SESSION | sessionKey=${sessionKey}`;
      console.log('[FunctionalChat]', line);
      try {
        (window as any)?.__JUCE__?.backend?.emitEvent?.('debugLog', { message: line });
      } catch {}
    } catch {}

    // IMPORTANT (Plugin stability): throttling writes to the JUCE bridge.
    // In embedded hosts, frequent large writes can freeze WKWebView and cause reload loops.
    if (!force) {
      try {
        const now = Date.now();
        const isHidden = typeof document !== 'undefined' ? Boolean(document.hidden) : false;
        if (isEmbedded && !isHidden && now - lastPersistAtRef.current < 4000) {
          return;
        }
        lastPersistAtRef.current = now;
      } catch {}
    } else {
      try {
        lastPersistAtRef.current = Date.now();
      } catch {}
    }

    // Ensure active mode state includes the latest UI state before persisting.
    const activeMode = selectedLearnLevel || previousModeRef.current || 'learn';
    const latestScroll = chatContainerRef.current?.scrollTop;
    const existingActive = modeStatesRef.current[activeMode] || {
      messages: [],
      currentStep,
      scrollPosition: 0,
      showOptions,
      showGenres,
      showReadyButton,
      showCompletedStep,
      completedStepText,
    };
    const liveMessages = messagesRef.current && messagesRef.current.length >= messages.length ? messagesRef.current : messages;
    modeStatesRef.current[activeMode] = {
      ...existingActive,
      messages: trimMessages(liveMessages),
      currentStep,
      scrollPosition: typeof latestScroll === 'number' ? latestScroll : existingActive.scrollPosition || 0,
      showOptions,
      showGenres,
      showReadyButton,
      showCompletedStep,
      completedStepText,
    };
    try {
      const dbg = ['PERSIST_DEBUG'];
      ['learn', 'create', 'pro'].forEach((m) => {
        const list = modeStatesRef.current[m]?.messages;
        const last = Array.isArray(list) && list.length > 0 ? list[list.length - 1] : null;
        const preview =
          last && typeof last.content === 'string'
            ? last.content.slice(0, 80).replace(/\s+/g, ' ')
            : '';
        dbg.push(`${m}: ${Array.isArray(list) ? list.length : 0} last="${preview}"`);
      });
      const line = dbg.join(' | ');
      console.log('[FunctionalChat]', line);
      try {
        (window as any)?.__JUCE__?.backend?.emitEvent?.('debugLog', { message: line });
      } catch {}
    } catch {}

    // Cap stored messages per mode to keep PropertiesFile writes stable.
    const cappedModeStates: any = {};
    (['learn', 'create', 'pro'] as const).forEach((mode) => {
      const st = modeStatesRef.current[mode];
      cappedModeStates[mode] = {
        ...st,
        messages: trimMessages(st?.messages ?? []),
      };
    });

    const sessionPayload = {
      v: 1,
      ownerEmail: (getSelectedProject() as any)?.ownerEmail || getActiveUserEmail(),
      selectedLearnLevel,
      completedSteps,
      hasCompletedAnalysis,
      modeStates: cappedModeStates,
      savedAt: Date.now(),
    };

    // Store per-project session inside a single persisted key (so C++ inject can stay simple)
    let root: any = {};
    try {
      const existing = safeGetItem(CHAT_STATE_KEY);
      if (existing && existing !== TOMBSTONE) {
        root = safeJsonParse<any>(existing, {});
      }
    } catch {}

    if (!root || typeof root !== 'object') root = {};
    if (!root.sessions || typeof root.sessions !== 'object') root.sessions = {};
    root.v = 2;
    // Do NOT persist pendingAi; it can leave the session "stuck" on reopen.
    root.sessions[sessionKey] = sessionPayload;
    root.savedAt = Date.now();

    safeSetItem(CHAT_STATE_KEY, JSON.stringify(root));
  }, [completedSteps, hasCompletedAnalysis, selectedLearnLevel, trimMessages]);

  useEffect(() => {
    persistChatStateNowRef.current = persistChatStateNow;
  }, [persistChatStateNow]);

  // Best-effort flush when component unmounts (e.g., plugin window closed while host stays open).
  useEffect(() => {
    return () => {
      try {
        persistChatStateNowRef.current?.({ force: true });
      } catch {}
    };
  }, []);

  useEffect(() => {
    // In embedded JUCE hosts, autosaving large chat state on every small UI change can freeze/reload the WebView.
    // We persist explicitly at stable points (after send/after response) + on pagehide/beforeunload via scroll hook flush.
    if (isEmbedded) return;
    const t = window.setTimeout(() => {
      try {
        persistChatStateNow();
      } catch (e) {
        console.warn('[FunctionalChat] Failed to persist chat state:', e);
      }
    }, 900);
    return () => window.clearTimeout(t);
  }, [persistChatStateNow, selectedLearnLevel, completedSteps, hasCompletedAnalysis, messages.length, currentStep, showOptions, showGenres, showReadyButton, showCompletedStep, completedStepText]);

  // Persist scroll position reliably.
  // In some hosts the chat container mounts after this component's first effect runs.
  // We attach/re-attach the scroll listener when the underlying DOM node becomes available.
  const attachedScrollElRef = useRef<HTMLDivElement | null>(null);
  const scrollCleanupRef = useRef<(() => void) | null>(null);
  const lastScrollPersistAtRef = useRef(0);
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const attachTo = (el: HTMLDivElement) => {
      const onScroll = () => {
        const mode = selectedLearnLevel || previousModeRef.current || 'learn';
        const st = modeStatesRef.current[mode];
        if (st) {
          modeStatesRef.current[mode] = { ...st, scrollPosition: el.scrollTop };
        }
        // IMPORTANT (Plugin stability): In embedded JUCE WebViews, persisting the full chat state on scroll
        // can spam the native bridge and freeze the UI (scroll events can fire frequently during layout/typing).
        // Keep scroll position in-memory; persist only on explicit flush events (pagehide/beforeunload/hidden).
        if (isEmbedded) return;

        if (scrollDebounceTimerRef.current) window.clearTimeout(scrollDebounceTimerRef.current);
        scrollDebounceTimerRef.current = window.setTimeout(() => {
          try {
            // Extra throttle: avoid writing large chat state too often even on web.
            const now = Date.now();
            if (now - lastScrollPersistAtRef.current < 2000) return;
            lastScrollPersistAtRef.current = now;
            persistChatStateNowRef.current?.();
          } catch {}
        }, 250);
      };

      const flush = () => {
        try {
          const mode = previousModeRef.current || 'learn';
          const st = modeStatesRef.current[mode];
          const live = chatContainerRef.current;
          if (st && live) {
            modeStatesRef.current[mode] = { ...st, scrollPosition: live.scrollTop };
          }
          persistChatStateNowRef.current?.();
        } catch {}
      };

      const onVisibility = () => {
        try {
          if (typeof document !== 'undefined' && document.hidden) flush();
        } catch {}
      };

      el.addEventListener('scroll', onScroll as any, { passive: true } as any);
      window.addEventListener('pagehide', flush as any);
      window.addEventListener('beforeunload', flush as any);
      document.addEventListener('visibilitychange', onVisibility as any);

      return () => {
        try {
          el.removeEventListener('scroll', onScroll as any);
          window.removeEventListener('pagehide', flush as any);
          window.removeEventListener('beforeunload', flush as any);
          document.removeEventListener('visibilitychange', onVisibility as any);
        } catch {}
      };
    };

    const ensureAttached = () => {
      const el = chatContainerRef.current;
      if (!el) return;
      if (attachedScrollElRef.current === el) return;
      // Re-attach if DOM node changed (e.g. host remounts WebView subtree).
      try {
        scrollCleanupRef.current?.();
      } catch {}
      attachedScrollElRef.current = el;
      scrollCleanupRef.current = attachTo(el);
    };

    ensureAttached();
    const t = window.setInterval(ensureAttached, 150);
    return () => {
      window.clearInterval(t);
      try {
        scrollCleanupRef.current?.();
      } catch {}
      scrollCleanupRef.current = null;
      attachedScrollElRef.current = null;
      if (scrollRestoreTimerRef.current) {
        window.clearTimeout(scrollRestoreTimerRef.current);
        scrollRestoreTimerRef.current = null;
      }
      pendingInitialScrollRef.current = null;
      if (scrollDebounceTimerRef.current) {
        window.clearTimeout(scrollDebounceTimerRef.current);
        scrollDebounceTimerRef.current = null;
      }
      try {
        persistChatStateNowRef.current?.();
      } catch {}
    };
  }, []);

  // Автоматическое сохранение состояния для текущего режима при изменениях
  useEffect(() => {
    if (chatContainerRef.current && previousModeRef.current) {
      const currentState: ModeState = {
        messages: [...messages],
        currentStep,
        scrollPosition: chatContainerRef.current.scrollTop,
        showOptions,
        showGenres,
        showReadyButton,
        showCompletedStep,
        completedStepText
      };
        modeStatesRef.current[selectedLearnLevel || previousModeRef.current || 'learn'] = currentState;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, currentStep, showOptions, showGenres, showReadyButton, showCompletedStep, completedStepText]);

  // Получаем название проекта и пользователя из localStorage
  useEffect(() => {
    const selectedProject = getSelectedProject();
    if (selectedProject && selectedProject.name) {
      setProjectName(selectedProject.name);
    }

    // Получаем информацию о текущем пользователе
    const currentUserData = localStorage.getItem('sairyne_current_user');
    if (currentUserData) {
      try {
        const user = JSON.parse(currentUserData);
        if (user && user.email) {
          // Можно добавить отображение email пользователя в UI
          if (IS_DEV) {
            console.debug('[chat] current user', user.email);
          }
        }
      } catch (error) {
        // В случае ошибки игнорируем
      }
    }
  }, []);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => setIsInterfaceReady(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (IS_DEV) {
      setIsOffline(false);
      setLastOnlineCheck(Date.now());
      return;
    }

    let isMounted = true;
    let backoffMs = 4000;
    let backoffTimer: number | null = null;

    const evaluateHealth = async () => {
      const healthy = await ChatService.checkHealth();
      if (!isMounted) return;
      if (healthy) {
        setIsOffline(false);
        setLastOnlineCheck(Date.now());
        backoffMs = 4000;
      } else {
        setIsOffline(true);
        // Backoff retries while offline to reduce load in plugin hosts
        if (backoffTimer) window.clearTimeout(backoffTimer);
        backoffTimer = window.setTimeout(() => {
          if (isMounted) evaluateHealth();
        }, backoffMs);
        backoffMs = Math.min(backoffMs * 2, 60000);
      }
    };

    const handleOnline = () => {
      setIsOffline(false);
      setLastOnlineCheck(Date.now());
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      evaluateHealth();

      return () => {
        isMounted = false;
        if (backoffTimer) window.clearTimeout(backoffTimer);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Создаем шаги чата с актуальным названием проекта
  const chatSteps = createChatSteps(projectName);

  const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // Добавляем пользовательское сообщение
  const addUserMessage = (content: string) => {
    const message: Message = {
      id: makeId('user'),
      type: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => {
      const next = [...prev, message];
      const mode = selectedLearnLevel || previousModeRef.current || 'learn';
      const existing = modeStatesRef.current[mode] || {
        messages: [],
        currentStep: 0,
        scrollPosition: 0,
        showOptions: false,
        showGenres: false,
        showReadyButton: false,
        showCompletedStep: false,
        completedStepText: '',
      };
      modeStatesRef.current[mode] = {
        ...existing,
        messages: trimMessages(next),
      };
      return next;
    });
    // Persist on next tick so messagesRef is up-to-date.
    setTimeout(() => {
      try {
        persistChatStateNowRef.current?.({ force: true });
      } catch {}
    }, 0);
    // Scroll to the new message once when it appears
    scrollToNewMessage();
  };

  const addAIMessageInstant = useCallback(
    (content: string) => {
      const message: Message = {
        id: makeId('ai'),
        type: 'ai',
        content,
        timestamp: Date.now(),
        isTyping: false,
        isThinking: false,
      };
      setMessages((prev) => {
        const next = [...prev, message];
        const mode = selectedLearnLevel || previousModeRef.current || 'learn';
        const existing = modeStatesRef.current[mode] || {
          messages: [],
          currentStep: 0,
          scrollPosition: 0,
          showOptions: false,
          showGenres: false,
          showReadyButton: false,
          showCompletedStep: false,
          completedStepText: '',
        };
        modeStatesRef.current[mode] = {
          ...existing,
          messages: trimMessages(next),
        };
        return next;
      });
      // Persist on next tick so messagesRef is up-to-date.
      setTimeout(() => {
        try {
          persistChatStateNowRef.current?.({ force: true });
        } catch {}
      }, 0);
      scrollToNewMessage();
    },
    [isEmbedded, selectedLearnLevel, trimMessages]
  );

  const persistSoon = useCallback(() => {
    try {
      // Best-effort: allow React state to settle first.
      window.setTimeout(() => {
        try {
          persistChatStateNowRef.current?.();
        } catch {}
      }, 150);
    } catch {}
  }, []);


  // Обработка отправки сообщения
  const handleSendMessage = async () => {
    // Guard against double-trigger (Enter + click, key repeat, WKWebView duplicate keydown)
    const now = Date.now();
    if (now - lastSendAtRef.current < 900) {
      return;
    }
    lastSendAtRef.current = now;
    // Any new user send should invalidate a pending Learn-mode context analysis response.
    learnAnalysisSeqRef.current += 1;

    if (!userInput.trim()) {
      console.log('[FunctionalChat] handleSendMessage: Empty input, ignoring');
      return;
    }
    
    const messageText = userInput.trim();
    console.log('[FunctionalChat] handleSendMessage called:', messageText);
    console.log('[FunctionalChat] Current mode:', selectedLearnLevel);
    console.log('[FunctionalChat] Current messages count:', messages.length);
    
    // Очищаем поле ввода сразу
    setUserInput("");
    
    // Проверяем режим: Pro Mode = AI, Create Mode = AI, Learn Mode = статичные шаги (ИЛИ AI активирован после step 6)
    const isProMode = selectedLearnLevel === 'pro';
    const isCreateMode = selectedLearnLevel === 'create';
    const isLearnModeAI = selectedLearnLevel === 'learn' && learnModeAIActive;
    const shouldUseAI = isProMode || isCreateMode || isLearnModeAI;
    
    console.log('[FunctionalChat] Is Pro Mode:', isProMode);
    console.log('[FunctionalChat] Is Create Mode:', isCreateMode);
    console.log('[FunctionalChat] Learn Mode AI Active:', isLearnModeAI);
    console.log('[FunctionalChat] Should Use AI:', shouldUseAI);
    
    if (shouldUseAI) {
      console.log('[FunctionalChat] AI Mode: Processing message', { isProMode, isCreateMode, isLearnModeAI });
      // Prevent concurrent AI requests from stacking (can cause multiple responses).
      if (aiRequestInFlightRef.current) {
        return;
      }
      aiRequestInFlightRef.current = true;
      setShowOptions(false);
      setShowGenres(false);
      setShowReadyButton(false);
      setShowStepContent(false);
      setShowCompletedStep(false);
      setCompletedStepText("");

      if (isOffline) {
        console.log('[FunctionalChat] Pro Mode: Offline, showing offline message');
        // Добавляем сообщение пользователя даже в оффлайн режиме
        addUserMessage(messageText);
        if (isEmbedded) {
          addAIMessageInstant("You're currently offline. Please reconnect to the server to continue the AI conversation.");
          persistSoon();
        } else {
          addAIMessage("You're currently offline. Please reconnect to the server to continue the AI conversation.");
        }
        return;
      }
      
      // PRO MODE: Используем AI (OpenAI)
      console.log('[FunctionalChat] Pro Mode: Starting AI request');
      
      // Показываем индикатор "AI думает"
      const thinkingId = Date.now().toString();
      
      // Add user message + thinking message in one state update, and persist a "pending AI request"
      // so reopening the plugin mid-request can resume/retry automatically.
      setMessages(prev => {
        // Создаем сообщение пользователя
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          type: 'user',
          content: messageText,
          timestamp: Date.now(),
        };
        
        // Добавляем сообщение пользователя и thinking сообщение
        const newMessages: Message[] = [
          ...prev,
          userMessage,
          {
            id: thinkingId,
            type: 'ai' as const,
            content: '...',
            timestamp: Date.now(),
            isThinking: true
          }
        ];
        
        console.log('[FunctionalChat] Pro Mode: Added user message and thinking, total messages:', newMessages.length);
        console.log('[FunctionalChat] Pro Mode: User message:', userMessage.content);
        
        // Скролл к новому сообщению после обновления
        setTimeout(() => scrollToNewMessage(), 50);
        
        // Формируем историю разговора (без thinking сообщения)
        const conversationHistory = newMessages
          .filter(msg => {
            const isValid = !msg.isThinking && !msg.isTyping && msg.content.trim() !== '';
            const isNotSystem = msg.content !== "Completed. Next step." && !msg.content.includes("Completed.");
            return isValid && isNotSystem;
          })
          .map(msg => ({
            type: msg.type,
            content: msg.content
          }));
        
        console.log('[FunctionalChat] Pro Mode: Conversation history length:', conversationHistory.length);
        console.log('[FunctionalChat] Pro Mode: Conversation history:', conversationHistory.map(m => ({ type: m.type, content: m.content.substring(0, 50) })));
        console.log('[FunctionalChat] Pro Mode: Sending to ChatService.sendMessage...');
        
        // Map selectedLearnLevel to AI mode
        let aiMode: 'pro' | 'create' | 'learn' = 'create'; // default
        if (selectedLearnLevel === 'pro') {
          aiMode = 'pro';
        } else if (selectedLearnLevel === 'create') {
          aiMode = 'create';
        } else if (learnModeAIActive) {
          aiMode = 'learn';
        }
        
        // Persist pending AI request for this project session (best-effort).
        // IMPORTANT: In embedded plugin hosts, persisting large chat state mid-request can cause save storms
        // and WebView reloads (about:blank), which truncates AI responses. We skip pending persistence in embedded.
        if (!isEmbedded) {
          try {
            const sessionKey = resolveActiveSessionKey();
            if (sessionKey) {
              let root: any = {};
              const existing = safeGetItem(CHAT_STATE_KEY);
              if (existing) root = safeJsonParse<any>(existing, {}) || {};
              if (!root || typeof root !== 'object') root = {};
              if (!root.sessions || typeof root.sessions !== 'object') root.sessions = {};
              if (!root.sessions[sessionKey] || typeof root.sessions[sessionKey] !== 'object') {
                root.sessions[sessionKey] = {};
              }
              root.sessions[sessionKey].pendingAi = {
                v: 1,
                messageText,
                mode: aiMode,
                startedAt: Date.now(),
                thinkingId,
                conversationHistory,
              };
              safeSetItem(CHAT_STATE_KEY, JSON.stringify(root));
            }
          } catch {}
        }

        // In embedded hosts, persist once after staging the request (avoid autosave storms).
        if (isEmbedded) {
          try {
            persistSoon();
          } catch {}
        }

        // Отправляем запрос асинхронно
        ChatService.sendMessage(messageText, conversationHistory, aiMode)
          .then(aiResponse => {
            console.log('[FunctionalChat] Pro Mode: Received AI response, length:', aiResponse?.length || 0);
            aiRequestInFlightRef.current = false;
            
            // Удаляем индикатор "думает"
            setMessages(prevMsgs => {
              const filtered = prevMsgs.filter(msg => msg.id !== thinkingId);
              console.log('[FunctionalChat] Pro Mode: Removed thinking message, remaining messages:', filtered.length);
              return filtered;
            });

            // Embedded hosts: render instantly (no typing animation) and clear pendingAi immediately.
            if (isEmbedded) {
              addAIMessageInstant(aiResponse);
              // Clear pendingAi quickly so reopening doesn't try to "resume" this response again.
              try {
                const sessionKey = resolveActiveSessionKey();
                if (sessionKey) {
                  const existing = safeGetItem(CHAT_STATE_KEY);
                  if (existing) {
                    const root = safeJsonParse<any>(existing, {}) || {};
                    if (root?.sessions?.[sessionKey]) {
                      delete root.sessions[sessionKey].pendingAi;
                      safeSetItem(CHAT_STATE_KEY, JSON.stringify(root));
                    }
                  }
                }
              } catch {}
              // Persist immediately so the completed AI message is saved even if the window closes right away.
              try {
                persistChatStateNowRef.current?.({ force: true });
              } catch {}
              // Also schedule a best-effort follow-up persist.
              persistSoon();
            } else {
              // Web: keep typing animation.
              addAIMessage(aiResponse, () => {
                try {
                  const sessionKey = resolveActiveSessionKey();
                  if (sessionKey) {
                    const existing = safeGetItem(CHAT_STATE_KEY);
                    if (existing) {
                      const root = safeJsonParse<any>(existing, {}) || {};
                      if (root?.sessions?.[sessionKey]) {
                        delete root.sessions[sessionKey].pendingAi;
                        safeSetItem(CHAT_STATE_KEY, JSON.stringify(root));
                      }
                    }
                  }
                } catch {}
              });
            }
            AnalyticsService.track('AIMessageSent', {
              mode: 'pro',
              characters: aiResponse?.length || 0,
            });
            
            console.log('[FunctionalChat] Pro Mode: Message sent successfully');
          })
          .catch(error => {
            console.error('[FunctionalChat] Pro Mode: AI chat error:', error);
            aiRequestInFlightRef.current = false;
            // Удаляем индикатор "думает"
            setMessages(prevMsgs => prevMsgs.filter(msg => !msg.isThinking));
            // Показываем сообщение об ошибке
            addAIMessage("Sorry, I couldn't process your request. Please try again.");
            // Keep pendingAi so user can retry on reopen (or we can auto-retry later).
          });
        
        return newMessages;
      });
      try {
        const selected = getSelectedProject();
        AnalyticsService.track('ChatMessageSent', {
          projectId: selected?.id ?? null,
          mode: selectedLearnLevel,
        });
      } catch {}
      
      // Manual scrolling only - let user control
      
      return;
    }
    
    // LEARN/CREATE MODE: Добавляем сообщение пользователя
    addUserMessage(messageText);
    
    // LEARN/CREATE MODE: Статичные шаги (существующая логика)
    // Если это сообщение "I'm ready! Let's start!", подсвечиваем кнопку
    if (messageText === "I'm ready! Let's start!") {
      setReadyButtonHighlighted(true);
    }
    
    // Скрываем все опции после отправки сообщения
    setShowOptions(false);
    setShowGenres(false);
    setShowReadyButton(false);
    setShowStepContent(false);
    setShowCompletedStep(false);
    setCompletedStepText("");
    

    // Находим текущий шаг и переходим к следующему
    const currentStepData = chatSteps.find(step => step.id === currentStep);
    if (currentStepData && currentStepData.nextStep !== undefined) {
      const nextStep = chatSteps[currentStepData.nextStep];
      if (nextStep) {
        // Если это шаг "thinking" (id: 2), показываем прозрачный текст с задержкой
        if (nextStep.isThinking) {
          addAIMessage(nextStep.ai, () => {
            // После показа thinking сообщения, исчезает через 2 секунды и переходим к следующему шагу
            setTimeout(() => {
              // Удаляем thinking сообщение
              setMessages(prev => prev.filter(msg => !msg.isThinking));
              
              // Переходим к следующему шагу
              if (nextStep && nextStep.nextStep !== undefined) {
                const realNextStep = chatSteps[nextStep.nextStep];
                if (realNextStep) {
                  setCurrentStep(nextStep.nextStep);
                  addAIMessage(realNextStep.ai, () => {
                  if (realNextStep.id === 3) {
                    setShowReadyButton(true);
                    // Кнопка появляется с прозрачным background, без подсветки
                  }
                  });
                }
              }
            }, 2000); // 2 секунды задержка для "thinking"
          }, true); // true = прозрачный текст
        } else {
          setTimeout(() => {
            if (currentStepData.nextStep !== undefined) {
              setCurrentStep(currentStepData.nextStep);
              const nextStep = chatSteps[currentStepData.nextStep];
              if (nextStep) {
                addAIMessage(nextStep.ai, () => {
              // Показываем соответствующие опции для следующего шага после завершения анимации
              setTimeout(() => {
                if (nextStep.id === 1) {
                  setShowGenres(true);
                } else if (nextStep.id === 3) {
                  setShowReadyButton(true);
                } else if (nextStep.id === 4) {
                  setShowStepContent(true);
                  // Показываем опции для шага 4 (Show visual tips, Completed. Next step.)
                  setTimeout(() => {
                    setShowOptions(true);
                    // Показываем "Completed. Next step." после завершения анимации
                    setTimeout(() => {
                      setShowCompletedStep(true);
                      // Анимация печатания для "Completed. Next step."
                      const text = "Completed. Next step.";
                      let charIndex = 0;
                      const typeTimer = setInterval(() => {
                        if (charIndex < text.length) {
                          setCompletedStepText(text.substring(0, charIndex + 1));
                          charIndex++;
                        } else {
                          clearInterval(typeTimer);
                        }
                      }, 50); // Скорость печатания
                      // Скролл к кнопке
                      scrollToNewMessage();
                    }, 3000); // Задержка после завершения анимации печатания
                  }, 500); // Задержка после завершения анимации печатания
                } else if (nextStep.id === 5) {
                  setShowStepContent(true);
                  // Для Step 5 (Step 2 of 7 — Kick Drum) показываем кнопку "Show visual tips" 
                  // после завершения анимации печатания, аналогично Step 4
                  setTimeout(() => {
                    setShowOptions(true);
                    // Автоматически показываем "Completed. Next step" через 3 секунды
                    // даже если пользователь не нажал "Show visual tips"
                    setTimeout(() => {
                      setShowCompletedStep(true);
                      // Анимация печатания для "Completed. Next step."
                      const text = "Completed. Next step.";
                      let charIndex = 0;
                      const typeTimer = setInterval(() => {
                        if (charIndex < text.length) {
                          setCompletedStepText(text.substring(0, charIndex + 1));
                          charIndex++;
                        } else {
                          clearInterval(typeTimer);
                        }
                      }, 50); // Скорость печатания
                      // Скролл к кнопке
                      scrollToNewMessage();
                    }, 3000); // 3 секунды задержка
                  }, 500); // Задержка после завершения анимации печатания
                } else if (nextStep.id === 6) {
                  // Последний шаг Learn mode - показываем кнопку "Completed. Next step" с анимацией
                  setTimeout(() => {
                    setShowCompletedStep(true);
                    // Анимация печатания для "Completed. Next step."
                    const text = "Completed. Next step.";
                    let charIndex = 0;
                    const typeTimer = setInterval(() => {
                      if (charIndex < text.length) {
                        setCompletedStepText(text.substring(0, charIndex + 1));
                        charIndex++;
                      } else {
                        clearInterval(typeTimer);
                      }
                    }, 50); // Скорость печатания
                    // Скролл к кнопке
                    scrollToNewMessage();
                  }, 500); // Задержка после завершения анимации печатания
                }
              }, 500); // Задержка после завершения анимации печатания
                });
              }
            }
          }, 1200);
        }
      }
    }
    
    // Очищаем поле ввода
    setUserInput("");
  };


  // Инициализация первого сообщения
  useEffect(() => {
    // Wait until we have a selected project (prevents flicker when selected_project arrives late)
    if (!isProjectSessionReady) return;
    // Wait until hydration gate is ready (avoids flashing first prompt before persisted messages load)
    if (!isHydrationGateReady) return;
    // If we still can't determine whether persisted messages exist for this session, do not show the prompt.
    // This avoids the "flash then disappear" when chat state arrives slightly later.
    try {
      const sessionKey = resolveActiveSessionKey();
      const hasPersisted = hasPersistedMessagesForSession(sessionKey);
      if (hasPersisted === null) return;
      if (hasPersisted === true) return;
    } catch {}
    // Only send the first workflow prompt if there is truly no restored chat state.
    if (!isInitializedRef.current && messages.length === 0) {
      isInitializedRef.current = true;
      const firstStep = chatSteps[0];
      addAIMessage(firstStep.ai, () => {
        setCurrentStep(0);
        // Показываем опции после завершения анимации печатания
        setTimeout(() => {
          setShowOptions(true);
        }, 500); // Небольшая задержка после завершения анимации
      });
    }
  }, [isProjectSessionReady, isHydrationGateReady, chatSteps, addAIMessage, messages.length]);

  useEffect(() => {
    AnalyticsService.track('PluginOpened', { embedded: isEmbedded });
    return () => {
      AnalyticsService.track('PluginClosed', { embedded: isEmbedded });
    };
  }, [isEmbedded]);

  // Автоскролл при добавлении новых сообщений
  useEffect(() => {
    // Не делаем автоскролл во время переключения Visual Tips
  }, [messages, showOptions, showGenres, showReadyButton, showStepContent, showCompletedStep, isTogglingVisualTips]);

  // Notify host (JUCE wrapper) about expanded state for Visual Tips / Analysis
  useEffect(() => {
    try {
      setPluginExpanded(Boolean(showVisualTips || showProjectAnalysis || showAnalysingChannels || showAnalysisSummary));
    } catch {}
  }, [showVisualTips, showProjectAnalysis, showAnalysingChannels, showAnalysisSummary]);

  // Сохраняем позицию скролла при изменении showVisualTips
  useLayoutEffect(() => {
    if (isTogglingVisualTips && chatContainerRef.current) {
      // Принудительно восстанавливаем позицию скролла до того, как браузер отрисует изменения
      chatContainerRef.current.scrollTop = savedScrollPositionRef.current;
      
      // Агрессивно блокируем скролл
      chatContainerRef.current.style.overflow = 'hidden';
      chatContainerRef.current.style.scrollBehavior = 'auto';
      
      // Дополнительная проверка через requestAnimationFrame для надежности
      requestAnimationFrame(() => {
        if (chatContainerRef.current && isTogglingVisualTips) {
          chatContainerRef.current.scrollTop = savedScrollPositionRef.current;
          chatContainerRef.current.style.overflow = 'hidden';
        }
      });
    }
  }, [showVisualTips, isTogglingVisualTips]);


  const handleAnalyze = useCallback(() => {
    // Если идет процесс анализа, показываем предупреждение
    if (showAnalysingChannels) {
      setShowAnalysisWarning(true);
      return;
    }
    
    // Если пользователь уже делал анализ, показываем popup с опциями
    if (hasCompletedAnalysis) {
      setShowAnalysisPopup(true);
      return;
    }
    
    // Если открываем Project Analysis, закрываем все другие окна
    if (!showProjectAnalysis) {
      setShowVisualTips(false);
      setShowAnalysingChannels(false);
      setShowAnalysisSummary(false);
    }
    setShowProjectAnalysis(!showProjectAnalysis);
  }, [showProjectAnalysis, showAnalysingChannels, hasCompletedAnalysis]);

  const handleStartAnalysis = useCallback(() => {
    setShowProjectAnalysis(false);
    setShowAnalysingChannels(true);
    
    // Отменяем предыдущий таймер, если он есть
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
    
    // Имитация FFT обработки - через 5 секунд показываем Analysis Summary
    analysisTimeoutRef.current = setTimeout(() => {
      setShowAnalysingChannels(false);
      setShowAnalysisSummary(true);
      setHasCompletedAnalysis(true); // Отмечаем, что анализ был выполнен
      analysisTimeoutRef.current = null;
    }, 5000); // 5 секунд на "анализ"
  }, []);

  const handleCancelAnalysis = useCallback(() => {
    // ✅ ОТМЕНЯЕМ ТАЙМЕР АНАЛИЗА
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
    
    setShowAnalysingChannels(false);
    setShowProjectAnalysis(true);
  }, []);

  const handleCloseAnalysisSummary = useCallback(() => {
    setShowAnalysisSummary(false);
  }, []);

  const handleCloseFixIssuesChat = useCallback(() => {
    setShowFixIssuesChat(false);
  }, []);

  const handleShowLastAnalysis = useCallback(() => {
    // Закрываем все другие окна перед показом Analysis Summary
    setShowVisualTips(false);
    setShowProjectAnalysis(false);
    setShowAnalysingChannels(false);
    setShowAnalysisSummary(true);
  }, []);

  const handleAnalysisPopupReanalysis = useCallback(() => {
    // Закрываем все другие окна и перезапускаем анализ
    setShowVisualTips(false);
    setShowProjectAnalysis(false);
    setShowAnalysisSummary(false);
    setShowAnalysingChannels(true);
    
    // Отменяем предыдущий таймер, если он есть
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
    
    analysisTimeoutRef.current = setTimeout(() => {
      setShowAnalysingChannels(false);
      setShowAnalysisSummary(true);
      analysisTimeoutRef.current = null;
    }, 5000);
  }, []);

  const handleReanalyse = useCallback(() => {
    // Перезапускаем анализ
    setShowAnalysisSummary(false);
    setShowAnalysingChannels(true);
    
    // Отменяем предыдущий таймер, если он есть
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
    
    analysisTimeoutRef.current = setTimeout(() => {
      setShowAnalysingChannels(false);
      setShowAnalysisSummary(true);
      analysisTimeoutRef.current = null;
    }, 5000);
  }, []);

  const handleFixIssues = useCallback((sectionTitle: string) => {
    if (IS_DEV) {
      console.debug('[analysis] fix issues for', sectionTitle);
    }
    // Показываем окно FixIssuesChat только для первого checkpoint (Critical Issues)
    if (sectionTitle === "Critical Issues") {
      setShowFixIssuesChat(true);
    }
  }, []);

  const handleCloseAnalysis = useCallback(() => {
    setShowAnalysingChannels(false);
  }, []);

  const handleLearn = useCallback(() => {
    if (IS_DEV) {
      console.debug('[learn] toggle panel');
    }
    setShowLearnMode((prev) => !prev);
  }, []);

  const handleLearnLevelSelect = useCallback((level: string) => {
    console.log('[FunctionalChat] Switching mode from', previousModeRef.current, 'to', level);
    
    // Если переключаемся на Pro Mode, закрываем FixIssuesChat чтобы показать основной чат
    if (level === 'pro' && showFixIssuesChat) {
      console.log('[FunctionalChat] Closing FixIssuesChat when switching to Pro Mode');
      setShowFixIssuesChat(false);
    }
    
    // Сохраняем текущее состояние перед переключением режима
    if (chatContainerRef.current) {
      const currentState: ModeState = {
        messages: [...messages],
        currentStep,
        scrollPosition: chatContainerRef.current.scrollTop,
        showOptions,
        showGenres,
        showReadyButton,
        showCompletedStep,
        completedStepText
      };
      modeStatesRef.current[previousModeRef.current] = currentState;
      console.log('[FunctionalChat] Saved state for', previousModeRef.current, ':', {
        messagesCount: currentState.messages.length,
        currentStep: currentState.currentStep
      });
    }
    
    // Восстанавливаем сохраненное состояние для нового режима
    const savedState = modeStatesRef.current[level];
    if (savedState) {
      console.log('[FunctionalChat] Restoring state for', level, ':', {
        messagesCount: savedState.messages.length,
        currentStep: savedState.currentStep
      });
      
      setMessages([...savedState.messages]);
      setCurrentStep(savedState.currentStep);
      setShowOptions(savedState.showOptions);
      setShowGenres(savedState.showGenres);
      setShowReadyButton(savedState.showReadyButton);
      setShowCompletedStep(savedState.showCompletedStep);
      setCompletedStepText(savedState.completedStepText);
      
      // Restore scroll reliably (may require waiting for DOM/layout)
      scheduleReliableScrollRestore(savedState.scrollPosition);
    } else {
      // Если режим новый, сбрасываем состояние
      console.log('[FunctionalChat] New mode', level, '- resetting state');
      setMessages([]);
      setCurrentStep(0);
      setShowOptions(false);
      setShowGenres(false);
      setShowReadyButton(false);
      setShowCompletedStep(false);
      setCompletedStepText("");
    }
    
    previousModeRef.current = level;
    setSelectedLearnLevel(level);
    // Persist the selected mode so the plugin can restore Pro after reload/reopen.
    try {
      const sessionKey = resolveActiveSessionKey();
      const key = sessionKey ? `${MODE_KEY}:${sessionKey}` : MODE_KEY;
      safeSetItem(key, level);
      lastModeWriteAtRef.current = Date.now();
    } catch {}
    
    console.log('[FunctionalChat] Mode switched to', level);
  }, [messages, currentStep, showOptions, showGenres, showReadyButton, showCompletedStep, completedStepText, showFixIssuesChat, scheduleReliableScrollRestore]);

  // Extra safety: if hydration completes but layout was not ready yet, retry restoring the scroll once.
  useEffect(() => {
    if (!isProjectSessionReady || !isHydrationGateReady) return;
    if (pendingInitialScrollRef.current == null) return;
    scheduleReliableScrollRestore(pendingInitialScrollRef.current);
  }, [isProjectSessionReady, isHydrationGateReady, messages.length, scheduleReliableScrollRestore]);

  const handleCloseLearnMode = useCallback(() => {
    setShowLearnMode(false);
  }, []);

  const handleCloseAnalysisWarning = useCallback(() => {
    setShowAnalysisWarning(false);
  }, []);

  // Функция для получения названия уровня
  const getLevelName = (level: string) => {
    switch (level) {
      case "learn": return "Learn";
      case "create": return "Create";
      case "pro": return "Pro";
      default: return "Learn";
    }
  };

  const handleSidebarClose = useCallback(() => {
    setShowSidebar(false);
  }, []);

  const handleVisualTipsToggle = useCallback(() => {
    // Если открываем Visual Tips, закрываем все другие окна
    if (!showVisualTips) {
      setShowProjectAnalysis(false);
      setShowAnalysingChannels(false);
      setShowAnalysisSummary(false);
    }
    
    // Сохраняем текущую позицию скролла
    const currentScrollTop = chatContainerRef.current?.scrollTop || 0;
    savedScrollPositionRef.current = currentScrollTop;
    
    // Устанавливаем флаг переключения СРАЗУ
    setIsTogglingVisualTips(true);
    
    // ПОЛНОСТЬЮ БЛОКИРУЕМ скролл на время анимации
    if (chatContainerRef.current) {
      chatContainerRef.current.style.overflow = 'hidden';
      chatContainerRef.current.style.scrollBehavior = 'auto';
      chatContainerRef.current.style.pointerEvents = 'none';
      // Фиксируем позицию скролла
      chatContainerRef.current.scrollTop = savedScrollPositionRef.current;
    }
    
    // Переключаем состояние
    AnalyticsService.track('VisualTipClicked', { action: showVisualTips ? 'hide' : 'show' });
    setShowVisualTips(!showVisualTips);
    
    // Восстанавливаем скролл и позицию после завершения transition (500ms)
    setTimeout(() => {
      if (chatContainerRef.current) {
        // Восстанавливаем скролл
        chatContainerRef.current.style.overflow = 'auto';
        chatContainerRef.current.style.scrollBehavior = 'smooth';
        chatContainerRef.current.style.pointerEvents = 'auto';
        
        // Принудительно восстанавливаем позицию скролла
        chatContainerRef.current.scrollTop = savedScrollPositionRef.current;
      }
      
      // Сбрасываем флаг переключения
      setIsTogglingVisualTips(false);
    }, ANIMATION.DURATION);
  }, [showVisualTips]);

  const handleReconnect = useCallback(async () => {
    setIsCheckingHealth(true);
    try {
      const healthy = await ChatService.checkHealth();
      if (healthy) {
        setIsOffline(false);
        setLastOnlineCheck(Date.now());
      } else {
        setIsOffline(true);
      }
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  // Обработка клика по опции
  const handleOptionClick = useCallback((option: string) => {
    // Обработка специальных опций - не добавляем в поле ввода
    if (option === "Show visual tips") {
      handleVisualTipsToggle();
      // На шаге 5 (Step 2 of 7) после показания Visual Tips показываем кнопку "Completed. Next step"
      if (currentStep === 5) {
        setTimeout(() => {
          setShowCompletedStep(true);
          setCompletedStepText("Completed. Next step.");
        }, 500);
      }
      return;
    }
    
    if (option === "Hide visual tips") {
      handleVisualTipsToggle();
      return;
    }
    
    // Для остальных опций помещаем текст в поле ввода
    setUserInput(option);
  }, [handleVisualTipsToggle, currentStep]);


  const mainContent = (
    <div 
      className={`relative overflow-hidden transition-all ease-out sairyne-surface bg-[#413f42] text-white ${isInterfaceReady ? 'opacity-100' : 'opacity-0'}`}
      style={{
        height: `${WINDOW.OUTER_HEIGHT}px`,
        width: showVisualTips || showProjectAnalysis || showAnalysingChannels || showAnalysisSummary ? `${WINDOW.EXPANDED_WIDTH}px` : `${WINDOW.OUTER_WIDTH}px`,
        borderRadius: `${WINDOW.OUTER_BORDER_RADIUS}px`,
        transitionDuration: `${ANIMATION.DURATION}ms`,
        transitionTimingFunction: ANIMATION.TIMING_FUNCTION
      }}>
    <div 
      className={`relative overflow-hidden transition-all ease-out sairyne-surface bg-[#413f42] text-white ${isInterfaceReady ? 'opacity-100' : 'opacity-0'}`}
      style={{
        height: `${WINDOW.OUTER_HEIGHT}px`,
        width: showVisualTips || showProjectAnalysis || showAnalysingChannels || showAnalysisSummary ? `${WINDOW.EXPANDED_WIDTH}px` : `${WINDOW.OUTER_WIDTH}px`,
        borderRadius: `${WINDOW.OUTER_BORDER_RADIUS}px`,
        transitionDuration: `${ANIMATION.DURATION}ms`,
        transitionTimingFunction: ANIMATION.TIMING_FUNCTION
      }}>
      {isOffline && (
        <div className="absolute left-4 right-4 top-4 z-[900] flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#b45309] px-4 py-3 text-sm text-white shadow-lg transition-opacity duration-300">
          <div className="flex flex-col">
            <span className="font-medium">Connection lost. Reconnect to restore AI features.</span>
            {lastOnlineCheck && (
              <span className="text-xs opacity-80">
                Last online: {new Date(lastOnlineCheck).toLocaleTimeString()}
              </span>
            )}
          </div>
          <button
            onClick={handleReconnect}
            disabled={isCheckingHealth}
            className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-white transition-colors hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isCheckingHealth ? 'Reconnecting…' : 'Reconnect'}
          </button>
        </div>
      )}

      {/* Vertical line between chat and right panel */}
      {(showVisualTips || showProjectAnalysis || showAnalysingChannels || showAnalysisSummary) && (
        <div 
          className="absolute transition-all ease-out"
          style={{
            top: `${WINDOW.INNER_TOP}px`,
            left: `${WINDOW.DIVIDER_LEFT}px`,
            width: `${WINDOW.DIVIDER_WIDTH}px`,
            height: `${WINDOW.OUTER_HEIGHT - WINDOW.INNER_TOP}px`,
            transitionDuration: `${ANIMATION.DURATION}ms`,
            transitionTimingFunction: ANIMATION.TIMING_FUNCTION,
            zIndex: 25,
            backgroundColor: 'rgba(255,255,255,0.2)'
          }}
        />
      )}

      <main 
        className="absolute overflow-hidden transition-all ease-out bg-[#141414]"
        style={{
          top: `${WINDOW.INNER_TOP}px`,
          left: `${WINDOW.INNER_LEFT}px`,
          height: `${WINDOW.INNER_HEIGHT}px`,
          width: showVisualTips || showProjectAnalysis || showAnalysingChannels || showAnalysisSummary ? '760px' : `${WINDOW.INNER_WIDTH}px`,
          borderRadius: `${WINDOW.INNER_BORDER_RADIUS}px`,
          transitionDuration: `${ANIMATION.DURATION}ms`,
          transitionTimingFunction: ANIMATION.TIMING_FUNCTION
        }}>
        {/* Left Column - Chat Content */}
        <div className="flex flex-col w-[377px] h-full relative">
            {/* Gradient Background */}
            <div
              className="absolute top-[calc(50.00%_-_429px)] left-[calc(50.00%_-_140px)] w-[278px] h-[278px] bg-[#6e24ab5e] rounded-[139px] blur-[122px]"
              aria-hidden="true"
            />

            {/* Project Header */}
            <div className="absolute top-0 left-[3px]">
              <Frame 
                projectName={projectName} 
                currentStep={currentStep + 1} 
                totalSteps={7}
                completedSteps={completedSteps}
                onBackToProjects={onBack}
              />
            </div>

            {/* Chat Messages Container - Мемоизированный компонент или FixIssuesChat */}
            {showFixIssuesChat ? (
              <div className="absolute top-[95px] left-[10px] bottom-[140px] overflow-y-auto w-[357px]" style={{
                backgroundColor: 'rgba(110, 36, 171, 0.05)',
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(110, 36, 171, 0.08), transparent 70%)'
              }}>
                <FixIssuesChat 
                  onClose={handleCloseFixIssuesChat}
                  existingMessages={messages}
                  onMessagesUpdate={(updatedMessages) => {
                    console.log('[FunctionalChat] FixIssuesChat updated messages, count:', updatedMessages.length);
                    setMessages(updatedMessages);
                  }}
                />
              </div>
            ) : (
              <ChatContainer
              messages={messages}
              showOptions={showOptions}
              showGenres={showGenres}
              showReadyButton={showReadyButton}
              showStepContent={showStepContent}
              showCompletedStep={showCompletedStep}
              currentStep={currentStep}
              readyButtonHighlighted={readyButtonHighlighted}
              completedStepText={completedStepText}
              onOptionClick={handleOptionClick}
              onGenreClick={handleOptionClick}
              onReadyClick={() => {
                setReadyButtonClicked(true);
                setUserInput("I'm ready! Let's start!");
              }}
              onVisualTipsToggle={handleVisualTipsToggle}
              showVisualTips={showVisualTips}
              isTogglingVisualTips={isTogglingVisualTips}
              chatContainerRef={chatContainerRef}
              chatSteps={chatSteps}
              selectedLearnLevel={selectedLearnLevel}
              onCompletedNextStep={() => {
                // Добавляем сообщение пользователя
                const userMessage: Message = {
                  id: `user-${Date.now()}`,
                  type: 'user',
                  content: "Completed. Next step.",
                  timestamp: Date.now()
                };
                setMessages(prev => [...prev, userMessage]);
                
                // Увеличиваем количество завершенных шагов
                setCompletedSteps(prev => prev + 1);
                
                // Сбрасываем все состояния кнопок
                setShowOptions(false);
                setShowGenres(false);
                setShowReadyButton(false);
                setShowStepContent(false);
                setShowCompletedStep(false);
                setCompletedStepText("");
                
                // Переходим к следующему шагу или запускаем AI анализ
                const currentStepData = chatSteps.find(step => step.id === currentStep);
                
                // Если текущий шаг требует AI анализа контекста
                if (currentStepData && currentStepData.useAIAnalysis) {
                  console.log('[Learn Mode → AI Analysis] Triggering AI context analysis');
                  
                  // Активируем AI диалог в Learn mode (остаёмся в Learn, но включаем AI)
                  setLearnModeAIActive(true);
                  console.log('[Learn Mode → AI Analysis] Activated AI in Learn Mode');

                  // Track this analysis request so we can ignore stale responses.
                  const seq = ++learnAnalysisSeqRef.current;
                  
                  // Собираем контекст Learn mode
                  const learnContext = messages
                    .filter(msg => !msg.isThinking && msg.content.trim() !== '')
                    .map(msg => ({
                      type: msg.type,
                      content: msg.content
                    }));
                  
                  // Отправляем контекст в backend для анализа
                  ChatService.analyzeLearnModeContext(learnContext)
                    .then(aiResponse => {
                      if (seq !== learnAnalysisSeqRef.current) return;
                      console.log('[Learn Mode → AI Analysis] Received analysis:', aiResponse.substring(0, 100) + '...');
                      // AI анализирует контекст и предлагает продолжение
                      addAIMessage(aiResponse);
                    })
                    .catch(error => {
                      if (seq !== learnAnalysisSeqRef.current) return;
                      console.error('[Learn Mode → AI Analysis] Error:', error);
                      addAIMessage("Let's continue building your track! What would you like to work on next?");
                    });
                  return;
                }
                
                // Обычный переход к следующему шагу
                if (currentStepData && currentStepData.nextStep !== undefined) {
                  const nextStep = chatSteps[currentStepData.nextStep];
                  if (nextStep) {
                    setCurrentStep(currentStepData.nextStep);
            addAIMessage(nextStep.ai, () => {
              // Показываем соответствующие опции для следующего шага после завершения анимации
              setTimeout(() => {
                if (nextStep.id === 1) {
                  setShowGenres(true);
                } else if (nextStep.id === 3) {
                  setShowReadyButton(true);
                } else if (nextStep.id === 4) {
                  setShowStepContent(true);
                  // Показываем опции для шага 4 (Show visual tips, Completed. Next step.)
                  setTimeout(() => {
                    setShowOptions(true);
                    // Показываем "Completed. Next step." после завершения анимации
                    setTimeout(() => {
                      setShowCompletedStep(true);
                      // Анимация печатания для "Completed. Next step."
                      const text = "Completed. Next step.";
                      let charIndex = 0;
                      const typeTimer = setInterval(() => {
                        if (charIndex < text.length) {
                          setCompletedStepText(text.substring(0, charIndex + 1));
                          charIndex++;
                        } else {
                          clearInterval(typeTimer);
                        }
                      }, 50); // Скорость печатания
                      // Скролл к кнопке
                      scrollToNewMessage();
                    }, 3000); // Задержка после завершения анимации печатания
                  }, 500); // Задержка после завершения анимации печатания
                } else if (nextStep.id === 5) {
                  setShowStepContent(true);
                  // Показываем кнопку "Show visual tips" после завершения анимации
                  setTimeout(() => {
                    setShowOptions(true);
                    // Автоматически показываем "Completed. Next step" через 3 секунды
                    // даже если пользователь не нажал "Show visual tips"
                    setTimeout(() => {
                      setShowCompletedStep(true);
                      // Анимация печатания для "Completed. Next step."
                      const text = "Completed. Next step.";
                      let charIndex = 0;
                      const typeTimer = setInterval(() => {
                        if (charIndex < text.length) {
                          setCompletedStepText(text.substring(0, charIndex + 1));
                          charIndex++;
                        } else {
                          clearInterval(typeTimer);
                        }
                      }, 50); // Скорость печатания
                      // Скролл к кнопке
                      scrollToNewMessage();
                    }, 3000); // 3 секунды задержка
                  }, 500); // Задержка после завершения анимации печатания
                } else if (nextStep.id === 6) {
                  // Последний шаг Learn mode - показываем кнопку "Completed. Next step" с анимацией
                  setTimeout(() => {
                    setShowCompletedStep(true);
                    // Анимация печатания для "Completed. Next step."
                    const text = "Completed. Next step.";
                    let charIndex = 0;
                    const typeTimer = setInterval(() => {
                      if (charIndex < text.length) {
                        setCompletedStepText(text.substring(0, charIndex + 1));
                        charIndex++;
                      } else {
                        clearInterval(typeTimer);
                      }
                    }, 50); // Скорость печатания
                    // Скролл к кнопке
                    scrollToNewMessage();
                  }, 500); // Задержка после завершения анимации печатания
                }
              }, 500); // Задержка после завершения анимации печатания
            });
                  }
                }
              }}
              showStep3Content={showStep3Content}
            />
            )}

            {showResumeBanner && (
              <div className="absolute left-[10px] right-[10px] bottom-[132px] z-[910] flex items-center justify-between gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm text-white backdrop-blur">
                <div className="truncate">
                  Response interrupted. You can resume/retry the last question.
                </div>
                <button
                  type="button"
                  onClick={() => resumeLastRequest()}
                  className="rounded-lg bg-white/15 px-3 py-1.5 text-white transition-colors hover:bg-white/25"
                >
                  Resume
                </button>
              </div>
            )}

            {/* Поле ввода сообщения */}
            <div
              className={`absolute bottom-[10px] left-[10px] h-[116px] rounded-[7px] backdrop-blur-[18.5px] transition-all duration-500 ease-out ${
                showVisualTips ? 'w-[357px]' : 'w-[357px]'
              } ${userInput ? 'ring-2 ring-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : ''} bg-[#ffffff0d] border border-white/5 text-white overflow-hidden`}
              style={{
                transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}
            >
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Message..."
                className="absolute top-[10px] left-[12px] w-[calc(100%-55px)] text-white bg-transparent border-none outline-none placeholder:text-[#ffffff6b] resize-none overflow-hidden"
                style={{ 
                  fontFamily: 'var(--body-font-family)',
                  fontSize: 'var(--body-font-size)',
                  fontStyle: 'var(--body-font-style)',
                  fontWeight: 'var(--body-font-weight)',
                  letterSpacing: 'var(--body-letter-spacing)',
                  lineHeight: 'var(--body-line-height)',
                  height: '60px',
                  overflowY: 'hidden'
                }}
              />

              {userInput ? (
                <button
                  className="absolute bottom-[6px] right-[6px] w-[28px] h-[28px] flex items-center justify-center rounded-md cursor-pointer transition-all duration-300 ease-out bg-[linear-gradient(134deg,rgba(115,34,182,1)_0%,rgba(83,12,141,1)_100%),linear-gradient(0deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.08)_100%)] shadow-[0_0_12px_rgba(168,85,247,0.5)] hover:shadow-[0_0_16px_rgba(168,85,247,0.7)] hover:brightness-110 hover:scale-110"
                  style={{
                    transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                  }}
                  type="button"
                  aria-label="Send message"
                  onClick={handleSendMessage}
                >
                  <img
                    className="w-[28px] h-[28px]"
                    alt="Send"
                    src={SEND_ICON}
                    style={{
                      filter: 'brightness(0) invert(1)'
                    }}
                  />
                </button>
              ) : (
                <img
                  className="absolute bottom-[6px] right-[6px] w-[28px] h-[28px] cursor-pointer transition-all duration-300 ease-out hover:scale-110 opacity-80 hover:opacity-100"
                  style={{
                    transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                  }}
                  alt="Send"
                  src={SEND_ICON}
                  onClick={handleSendMessage}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(258deg) brightness(104%) contrast(97%) drop-shadow(0 0 8px rgba(168,85,247,0.6))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = '';
                  }}
                />
              )}

              <button
                onClick={handleAnalyze}
                disabled={currentStep < 5}
                className={`absolute bottom-[6px] right-[268px] flex items-center gap-1 rounded-[6px] px-[7px] py-[7px] transition-all duration-300 ease-out ${
                  currentStep < 5 
                    ? 'bg-[#21182940] border border-solid border-[#e8ceff10] text-white cursor-not-allowed opacity-50' 
                    : 'bg-[#211829] border border-solid border-[#e8ceff21] text-white hover:bg-[#2a1f35] hover:border-[#e8ceff40] cursor-pointer'
                }`}
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}
              >
                <img
                  className="w-4 h-4"
                  alt="Analysis"
                  src={ANALYSIS_ICON}
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
                aria-expanded={showLearnMode}
                className={`absolute bottom-[6px] left-[93px] flex items-center gap-1 rounded-[6px] px-[7px] py-[7px] cursor-pointer transition-all duration-300 ease-out bg-[#211829] border border-solid text-white hover:bg-[#2a1f35] hover:border-[#e8ceff40] ${
                  showLearnMode
                    ? 'border-[#e8ceff80] ring-2 ring-purple-500/40'
                    : 'border-[#e8ceff21]'
                }`}
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}
              >
                <img
                  className="w-4 h-4"
                  alt="Learn"
                  src={LEARN_ICON}
                />
                <span className="text-white" style={{
                  fontFamily: 'var(--helper-font-family)',
                  fontSize: 'var(--helper-font-size)',
                  fontStyle: 'var(--helper-font-style)',
                  fontWeight: 'var(--helper-font-weight)',
                  letterSpacing: 'var(--helper-letter-spacing)',
                  lineHeight: 'var(--helper-line-height)'
                }}>{getLevelName(selectedLearnLevel)}</span>
                <img
                  className="w-[6.93px] h-[4.5px]"
                  alt="Select level"
                  src={CARET_ICON}
                  style={{
                    transform: showLearnMode ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 200ms ease'
                  }}
                />
              </button>

              {/* LearnMode */}
              <ErrorBoundary componentName="LearnMode">
                <LearnMode 
                  isOpen={showLearnMode}
                  onClose={handleCloseLearnMode}
                  selectedLevel={selectedLearnLevel}
                  onLevelSelect={handleLearnLevelSelect}
                />
              </ErrorBoundary>

              {/* Analysis Warning */}
              <ErrorBoundary componentName="AnalysisWarning">
                <AnalysisWarning 
                  isOpen={showAnalysisWarning}
                  onClose={handleCloseAnalysisWarning}
                />
              </ErrorBoundary>

              {/* Analysis Popup */}
              <ErrorBoundary componentName="AnalysisPopup">
                <AnalysisPopup 
                  isVisible={showAnalysisPopup}
                  onClose={() => setShowAnalysisPopup(false)}
                  onShowLastAnalysis={handleShowLastAnalysis}
                  onReanalysis={handleAnalysisPopupReanalysis}
                />
              </ErrorBoundary>
            </div>
        </div>

        {/* Right Column - Visual Tips Panel */}
        {showVisualTips && !showProjectAnalysis && !showAnalysingChannels && !showAnalysisSummary && (
          <div 
            className="absolute overflow-y-auto transition-all ease-out overscroll-none"
            style={{
              top: 0,
              right: `${WINDOW.INNER_LEFT}px`,
              width: `${WINDOW.RIGHT_PANEL_WIDTH}px`,
              height: `${WINDOW.INNER_HEIGHT}px`,
              transitionDuration: `${ANIMATION.DURATION}ms`,
              transitionTimingFunction: ANIMATION.TIMING_FUNCTION
            }}
          >
            {/* Visual Tips Header - sticky */}
            <div className="sticky top-0 left-0 right-0 z-50 bg-[#141414] h-[40px]">
              <div className="absolute top-[10px] left-0 right-0 flex items-center justify-center px-3 h-5">
                {/* Close button in left corner */}
                <button
                  onClick={handleVisualTipsToggle}
                  className="absolute left-3 w-5 h-5 flex items-center justify-center hover:opacity-80 transition-opacity"
                  aria-label="Close visual tips"
                >
                  <img
                    className="w-[14px] h-[14px]"
                    alt="Close"
                    src={closeIcon}
                  />
                </button>
                
                <h2 className="[font-family:'DM_Sans',Helvetica] font-medium text-white text-[13px] tracking-[0] leading-[normal]">
                  Visual tips
                </h2>
              </div>

              {/* Horizontal line for Visual Tips */}
              <div className="absolute bottom-0 left-0 w-[383px] h-[1px] bg-white/10" />
            </div>

            {/* Visual Tips Content */}
            <div className="pt-[40px]">
              <ErrorBoundary 
                componentName="VisualTips"
                fallback={
                  <div className="p-4 text-center text-gray-500">
                    Visual Tips temporarily unavailable
                  </div>
                }
              >
                <VisualTips currentStep={currentStep} />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Right Column - Project Analysis Panel */}
        {showProjectAnalysis && !showVisualTips && !showAnalysingChannels && !showAnalysisSummary && (
          <div 
            className="absolute overflow-y-auto transition-all ease-out"
            style={{
              top: 0,
              right: `${WINDOW.INNER_LEFT}px`,
              width: `${WINDOW.RIGHT_PANEL_WIDTH}px`,
              height: `${WINDOW.INNER_HEIGHT}px`,
              transitionDuration: `${ANIMATION.DURATION}ms`,
              transitionTimingFunction: ANIMATION.TIMING_FUNCTION
            }}
          >
            {/* Project Analysis Content */}
            <div className="pt-0">
              <ErrorBoundary 
                componentName="ProjectAnalysis"
                fallback={
                  <div className="p-4 text-center text-gray-500">
                    Analysis panel temporarily unavailable
                  </div>
                }
              >
                <ProjectAnalysis 
                  onStartAnalysis={handleStartAnalysis} 
                  onClose={handleAnalyze}
                />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Right Column - Analysing Channels Panel */}
        {showAnalysingChannels && !showVisualTips && !showProjectAnalysis && !showAnalysisSummary && (
          <div 
            className="absolute overflow-y-auto transition-all ease-out"
            style={{
              top: 0,
              right: `${WINDOW.INNER_LEFT}px`,
              width: `${WINDOW.RIGHT_PANEL_WIDTH}px`,
              height: `${WINDOW.INNER_HEIGHT}px`,
              transitionDuration: `${ANIMATION.DURATION}ms`,
              transitionTimingFunction: ANIMATION.TIMING_FUNCTION
            }}
          >
            {/* Analysing Channels Content */}
            <div className="pt-0">
              <ErrorBoundary 
                componentName="AnalysingChannels"
                fallback={
                  <div className="p-4 text-center text-gray-500">
                    Analysis animation temporarily unavailable
                  </div>
                }
              >
                <AnalysingChannels 
                  onCancelAnalysis={handleCancelAnalysis}
                  onClose={handleCloseAnalysis}
                />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Right Column - Analysis Summary Panel */}
        {showAnalysisSummary && !showVisualTips && !showProjectAnalysis && !showAnalysingChannels && (
          <div 
            className="absolute overflow-y-auto transition-all ease-out"
            style={{
              top: 0,
              right: `${WINDOW.INNER_LEFT}px`,
              width: `${WINDOW.RIGHT_PANEL_WIDTH}px`,
              height: `${WINDOW.INNER_HEIGHT}px`,
              transitionDuration: `${ANIMATION.DURATION}ms`,
              transitionTimingFunction: ANIMATION.TIMING_FUNCTION
            }}
          >
            {/* Analysis Summary Content */}
            <div className="pt-0">
              <ErrorBoundary 
                componentName="AnalysisSummary"
                fallback={
                  <div className="p-4 text-center text-gray-500">
                    Analysis summary temporarily unavailable
                  </div>
                }
              >
                <AnalysisSummary 
                  onClose={handleCloseAnalysisSummary}
                  onReanalyse={handleReanalyse}
                  onFixIssues={handleFixIssues}
                />
              </ErrorBoundary>
            </div>
          </div>
        )}
      </main>

      </div>


      {/* Sidebar Menu */}
      <SidebarMenu 
        isVisible={showSidebar} 
        onClose={handleSidebarClose} 
      />
    </div>
  );

  return mainContent;
};