type Listener = (active: boolean) => void;

// Multiple parts of the app can independently mark themselves as "loading".
// We consider the app loading if ANY source is active.
const sources = new Map<string, boolean>();
const listeners = new Set<Listener>();
let isActive = false;

function recomputeAndNotify() {
  const next = Array.from(sources.values()).some(Boolean);
  if (next === isActive) return;
  isActive = next;
  listeners.forEach((l) => {
    try {
      l(isActive);
    } catch {
      // ignore
    }
  });
}

export function setGlobalLoading(source: string, active: boolean) {
  if (!source) return;
  sources.set(source, Boolean(active));
  recomputeAndNotify();
}

export function clearGlobalLoading(source: string) {
  if (!source) return;
  sources.delete(source);
  recomputeAndNotify();
}

export function subscribeGlobalLoading(listener: Listener): () => void {
  listeners.add(listener);
  // Push current state immediately
  try {
    listener(isActive);
  } catch {}
  return () => {
    listeners.delete(listener);
  };
}

export function isGlobalLoading(): boolean {
  return isActive;
}


