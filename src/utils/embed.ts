let cachedResult: boolean | null = null;
let availabilityResolved = false;

const detect = (): boolean => {
  if (typeof window === "undefined") {
    availabilityResolved = true;
    return false;
  }

  try {
    const isEmbed =
      window.self !== window.top ||
      window.location.pathname?.toLowerCase().includes("embed-chat") ||
      window.location.search?.toLowerCase().includes("embed=1");

    availabilityResolved = true;
    return isEmbed;
  } catch {
    availabilityResolved = true;
    return true;
  }
};

export const resolveIsEmbedded = (): boolean => {
  if (cachedResult === null) {
    cachedResult = detect();
  }

  return cachedResult;
};

export const applyEmbedFlagToBody = (): void => {
  if (typeof document === "undefined") return;

  const embedded = resolveIsEmbedded();

  if (embedded) {
    document.body.setAttribute("data-embed", "true");
  } else {
    document.body.removeAttribute("data-embed");
  }
};

export const onEmbedStatusSettled = (cb: (isEmbedded: boolean) => void): void => {
  if (availabilityResolved) {
    cb(resolveIsEmbedded());
    return;
  }

  requestAnimationFrame(() => {
    cb(resolveIsEmbedded());
  });
};


