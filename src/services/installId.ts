import { safeGetItem, safeSetItem } from "../utils/storage";

const INSTALL_ID_KEY = "sairyne_install_id";
const TOMBSTONE = "0";

function generateInstallId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }

  // Fallback: not cryptographically strong, but fine as a stable install identifier.
  return `inst_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * Stable per-install identifier (persisted in JUCE settings via safeSetItem).
 * This is NOT a secret. It's useful for anti-abuse / licensing correlation server-side.
 */
export function getOrCreateInstallId(): string {
  const existing = safeGetItem(INSTALL_ID_KEY);
  if (existing && existing !== TOMBSTONE) return existing;

  const created = generateInstallId();
  safeSetItem(INSTALL_ID_KEY, created);
  return created;
}


