import { createRoot } from "react-dom/client";
import App from "./App";
import { saveDataToJuce } from "./services/audio/juceBridge";

// Mirror sairyne_* localStorage writes into JUCE persistence (critical for AU/WKWebView)
// This runs inside the iframe/web app context, so it catches app writes reliably.
function installLocalStorageMirrorToJuce() {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") return;
  try {
    const ALLOW = new Set([
      "sairyne_access_token",
      "sairyne_selected_project",
      "sairyne_projects",
      "sairyne_users",
      "sairyne_current_user",
      "sairyne_functional_chat_state_v1",
      "sairyne_signin_draft_email",
    ]);

    const original = window.localStorage.setItem.bind(window.localStorage);
    window.localStorage.setItem = (key: string, value: string) => {
      // Always do original behavior first
      original(key, value);
      try {
        if (key && key.startsWith("sairyne_") && ALLOW.has(key)) {
          saveDataToJuce(key, String(value ?? ""));
        }
      } catch {
        // best-effort
      }
    };
  } catch {
    // best-effort
  }
}

installLocalStorageMirrorToJuce();

// Debug ping: prove whether iframe -> wrapper postMessage works in AU/WKWebView.
// Wrapper is instrumented to log any JUCE_DATA via juce://debug in Sairyne.log.
try {
  if (typeof window !== "undefined" && window.parent && window.parent !== window) {
    window.parent.postMessage(
      { type: "JUCE_DATA", command: "debug_ping", payload: { key: "debug_ping", value: "ping" } },
      "*"
    );
  }
} catch {
  // ignore
}

createRoot(document.getElementById("app") as HTMLElement).render(
  <App />
);
