import React, { useEffect, useState } from "react";
import { Window } from "../../components/Window";
import { MasterChannelNotice } from "../../components/MasterChannelNotice";
import { getCurrentUser } from "../../services/auth";
import { openUrlInSystemBrowser } from "../../services/audio/juceBridge";
import { resolveIsEmbedded } from "../../utils/embed";
import { safeSetItem, safeGetItem } from "../../utils/storage";
import profilePhoto from "../../assets/img/photo-2025-10-18-23-33-13-1.png";
import { API_URL } from "../../config/api";
import { AnalyticsService } from "../../services/analyticsService";

interface SignInProps {
  onNext: () => void;
  onBack: () => void;
}

export const SignIn = ({ onNext }: SignInProps): JSX.Element => {
  const existingUser = typeof window !== "undefined" ? getCurrentUser() : null;
  const [email, setEmail] = useState(existingUser?.email ?? "");
  const [password, setPassword] = useState("");
  useEffect(() => {
    const user = typeof window !== "undefined" ? getCurrentUser() : null;
    if (user?.email) {
      setEmail(user.email);
      return;
    }
    // Fallback: restore draft email (useful when plugin UI reloads before login)
    const draft = safeGetItem('sairyne_signin_draft_email');
    if (draft) {
      setEmail(draft);
    }
  }, []);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Убрали жесткие ограничения на домены - теперь любые email принимаются

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setErrorMessage("Please enter a valid email address");
      setShowError(true);
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters");
      setShowError(true);
      return;
    }

    try {
      // Send login request to backend
      console.log('🔐 DEBUG API_URL constant:', API_URL);
      console.log('🔐 DEBUG import.meta.env.DEV:', import.meta.env.DEV);
      console.log('🔐 DEBUG import.meta.env.VITE_API_URL:', import.meta.env.VITE_API_URL);
      
      const requestBody = JSON.stringify({ email: email.trim(), password });
      console.log('📨 Fetch body:', requestBody);

      const locationInfo =
        typeof window !== 'undefined'
          ? { href: window.location.href, protocol: window.location.protocol, host: window.location.host }
          : { href: 'n/a', protocol: 'n/a', host: 'n/a' };

      // WebViews can behave differently depending on whether we are loaded from file:// or http://.
      // To maximize robustness inside Ableton/Logic, try a small set of known-good bases.
      const rawBases = [
        API_URL, // can be '' on Vercel to force same-origin /api proxy
        'http://127.0.0.1:8000',
        'http://localhost:8000',
        'https://sairyne-fullai-5.onrender.com',
      ];

      // Avoid mixed-content attempts when loaded from https (WKWebView can throw cryptic errors).
      const candidateBases = Array.from(
        new Set(
          rawBases.filter((b) => {
            if (b === '' || b == null) return true;
            if (locationInfo.protocol === 'https:' && b.startsWith('http://')) return false;
            return true;
          })
        )
      );

      const tryLoginOnce = async (base: string, path: string) => {
        const url = base ? `${base}${path}` : path; // base '' => same-origin /api/...
        console.log('📤 Starting fetch to:', url, { base, path, locationInfo });
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody,
        });
        return { resp, url };
      };

      let response: Response | null = null;
      let usedUrl = '';

      // Prefer real Mongo-backed endpoint first, then dev endpoint as fallback.
      const pathsToTry = ['/api/auth/simple-login', '/api/auth/simple-login-dev'];

      let lastError: any = null;
      for (const base of candidateBases) {
        for (const path of pathsToTry) {
          try {
            const { resp, url } = await tryLoginOnce(base, path);
            usedUrl = url;
            response = resp;
            // If we got an HTTP response (even 401), stop iterating bases/paths.
            break;
          } catch (err) {
            lastError = err;
            console.error('❌ Fetch failed:', { base, path, err });
          }
        }
        if (response) break;
      }

      if (!response) {
        const details = lastError?.message ? ` (${lastError.message})` : '';
        setErrorMessage(
          `Network error inside plugin. Unable to reach login server.${details}\n\n` +
            `Loaded from: ${locationInfo.href}\n` +
            `Tried bases: ${candidateBases.join(', ')}`
        );
        setShowError(true);
        return;
      }

      console.log('📡 Response received! Status:', response.status, response.statusText, 'URL:', usedUrl);
      console.log('📡 Response headers:', {
        'content-type': response.headers.get('content-type'),
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      });
      
      console.log('📦 Parsing JSON...');
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        setErrorMessage(data.error || "Invalid email or password");
        setShowError(true);
        return;
      }

      console.log('✅ Login successful!', data);

      // User authenticated! Save locally
      try {
        const osBootId = safeGetItem("sairyne_os_boot_id");
        if (osBootId) {
          safeSetItem("sairyne_last_os_boot_id", osBootId);
        }
        // Persist in JUCE-backed storage (source of truth in plugin)
        safeSetItem('sairyne_access_token', String(data.token ?? ''));
        safeSetItem(
          'sairyne_current_user',
          JSON.stringify({
            id: typeof data.user?.id === 'number' ? data.user.id : Date.now(),
            email: String(data.user?.email ?? email).trim(),
            password: '',
            loginTime: new Date().toISOString(),
          })
        );
        // Also keep legacy keys as cache/debug (optional)
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('email', data.user.email);
        }
      } catch (e) {
        console.warn('[SignIn] Failed to persist auth via safeSetItem:', e);
      }

      AnalyticsService.track('SignInSuccess', { email: email.trim().toLowerCase() });
      onNext();
    } catch (error) {
      const err = error as any;
      console.error('❌ Login error:', err);
      console.error('Error message:', err?.message);
      console.error('Error stack:', err?.stack);

      const locationInfo =
        typeof window !== 'undefined'
          ? { href: window.location.href, protocol: window.location.protocol, host: window.location.host }
          : { href: 'n/a', protocol: 'n/a', host: 'n/a' };

      // Show the real underlying reason (WebView fetch often fails with a useful message)
      const details = err?.message ? `\n\nDetails: ${String(err.message)}` : '';
      setErrorMessage(
        `Network error. Please check your connection and try again.${details}\n\n` +
          `Loaded from: ${locationInfo.href}\n` +
          `API_URL: ${API_URL || '(empty)'}`
      );
      setShowError(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Предотвращаем автоматическую отправку формы при нажатии Enter
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  // Persist draft email so it doesn't disappear when AU/VST3 UI reloads
  useEffect(() => {
    try {
      if (email && email.trim().length > 0) {
        safeSetItem('sairyne_signin_draft_email', email.trim());
      }
    } catch {
      // ignore
    }
  }, [email]);

  const handleForgotPassword = () => {
    const url = 'https://www.sairyne.net/reset-password';
    // Always go through the JUCE bridge helper; AU (WKWebView) can block direct window.open.
    openUrlInSystemBrowser(url);
  };

  const handleSignUp = () => {
    // Open website registration/sign-in flow in system browser (plugin-safe).
    // This avoids embedding registration inside the plugin WebView.
    openUrlInSystemBrowser('https://www.sairyne.net/sign-in');
  };

  const closeError = () => {
    setShowError(false);
    setErrorMessage("");
  };

  return (
    <>
      <MasterChannelNotice />
      <Window
        title="Sairyne"
        onMinimize={() => {/* minimize logic */}}
        onClose={() => {/* close logic */}}
      >
        <main className="absolute top-[34px] left-[3px] w-[377px] h-[810px] bg-[#141414] rounded-[7px] overflow-hidden">
          <div
            className="absolute top-[calc(50.00%_-_429px)] left-[calc(50.00%_-_140px)] w-[278px] h-[278px] bg-[#6e24ab5e] rounded-[139px] blur-[122px]"
            aria-hidden="true"
          />

          <div className="absolute top-[95px] left-[calc(50.00%_-_56px)] w-[110px] h-[110px] flex bg-[#141414] rounded-[59.6px] overflow-hidden border-[1.34px] border-solid border-[#9956c580]">
            <img
              className="w-[110px] h-[110px] aspect-[1]"
              alt="Profile photo"
              src={profilePhoto}
            />
          </div>

          <div className="absolute top-[264px] left-[calc(50.00%_-_154px)] w-[313px] h-[311px] flex flex-col items-center">
            <h2 className="ml-[-7px] h-9 w-[82px] font-h1 font-[number:var(--h1-font-weight)] text-[#f7efff] text-[length:var(--h1-font-size)] text-center tracking-[var(--h1-letter-spacing)] leading-[var(--h1-line-height)] [font-style:var(--h1-font-style)] whitespace-nowrap">
              Sign in
            </h2>

            <form
              onSubmit={handleSubmit}
              className="w-full flex flex-col items-center"
            >
              <div className="-ml-1.5 h-10 w-[307px] mt-[30px] flex bg-[#ffffff0d] rounded-[36px] border border-solid border-[#ffffff1c]">
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    console.log('📧 Email changed:', e.target.value);
                    setEmail(e.target.value);
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Email"
                  className="w-full h-full px-3.5 py-2.5 font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)] placeholder:text-[#ffffff80]"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="-ml-1.5 h-10 w-[307px] mt-5 flex bg-[#ffffff0d] rounded-[36px] border border-solid border-[#ffffff1c]">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Password"
                  className="w-full h-full px-3.5 py-2.5 font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)] placeholder:text-[#ffffff80]"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="-ml-1.5 h-5 w-[107px] mt-[19px] font-body font-[number:var(--body-font-weight)] text-[#c387f4] text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] whitespace-nowrap [font-style:var(--body-font-style)] hover:underline focus:underline focus:outline-none"
              >
                Forgot password?
              </button>

              <button
                type="submit"
                className="flex -ml-1.5 h-10 w-[307px] relative mt-[23px] items-center justify-center gap-2.5 px-2.5 py-[7px] rounded-[36px] border-[none] bg-[linear-gradient(134deg,rgba(115,34,182,1)_0%,rgba(83,12,141,1)_100%)] before:content-[''] before:absolute before:inset-0 before:p-px before:rounded-[36px] before:[background:linear-gradient(180deg,rgba(255,255,255,0.11)_0%,rgba(255,255,255,0.01)_100%)] before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:z-[1] before:pointer-events-none hover:opacity-90 focus:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#c387f4] focus:ring-offset-2 focus:ring-offset-[#141414] transition-opacity"
              >
                <span className="relative w-fit font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] text-center tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] whitespace-nowrap [font-style:var(--body-font-style)]">
                  Login
                </span>
              </button>
            </form>

            <p className="ml-[-7px] h-5 w-[190px] mt-[23px] font-body font-[number:var(--body-font-weight)] text-transparent text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] whitespace-nowrap [font-style:var(--body-font-style)]">
              <span className="text-[#ffffff80] font-body [font-style:var(--body-font-style)] font-[number:var(--body-font-weight)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] text-[length:var(--body-font-size)]">
                Don&apos;t have an account?
              </span>
              <span className="text-white font-body [font-style:var(--body-font-style)] font-[number:var(--body-font-weight)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] text-[length:var(--body-font-size)]">
                {" "}
              </span>
              <button
                type="button"
                onClick={handleSignUp}
                className="text-white font-body [font-style:var(--body-font-style)] font-[number:var(--body-font-weight)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] text-[length:var(--body-font-size)] hover:underline focus:underline focus:outline-none"
              >
                Sign up
              </button>
            </p>
          </div>
        </main>
      </Window>

      {/* Error Modal */}
      {showError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative w-[383px] h-[200px] bg-[#413f42] rounded-[10px] overflow-hidden">
            <div className="absolute top-[34px] left-[3px] w-[377px] h-[160px] bg-[#141414] rounded-[7px] flex flex-col items-center justify-center p-6">
              <div className="text-center">
                <h3 className="font-h1 font-[number:var(--h1-font-weight)] text-[#f7efff] text-[length:var(--h1-font-size)] text-center tracking-[var(--h1-letter-spacing)] leading-[var(--h1-line-height)] [font-style:var(--h1-font-style)] mb-4">
                  Error
                </h3>
                <p className="font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)] mb-6 whitespace-pre-line break-words select-text max-h-[90px] overflow-y-auto">
                  {errorMessage}
                </p>
                <button
                  onClick={closeError}
                  className="flex h-10 w-[120px] items-center justify-center gap-2.5 px-2.5 py-[7px] rounded-[36px] border-[none] bg-[linear-gradient(134deg,rgba(115,34,182,1)_0%,rgba(83,12,141,1)_100%)] before:content-[''] before:absolute before:inset-0 before:p-px before:rounded-[36px] before:[background:linear-gradient(180deg,rgba(255,255,255,0.11)_0%,rgba(255,255,255,0.01)_100%)] before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:z-[1] before:pointer-events-none hover:opacity-90 focus:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#c387f4] focus:ring-offset-2 focus:ring-offset-[#141414] transition-opacity"
                >
                  <span className="relative w-fit font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] text-center tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] whitespace-nowrap [font-style:var(--body-font-style)]">
                    OK
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
