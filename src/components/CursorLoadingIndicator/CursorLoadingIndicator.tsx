import { useEffect, useRef, useState } from "react";
import { subscribeGlobalLoading } from "../../services/loadingService";

export function CursorLoadingIndicator() {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 16, y: 16 });
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    return subscribeGlobalLoading(setActive);
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent | MouseEvent) => {
      pendingRef.current = { x: (e as any).clientX ?? 0, y: (e as any).clientY ?? 0 };
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        if (pendingRef.current) setPos(pendingRef.current);
      });
    };

    window.addEventListener("pointermove", onMove as any, { passive: true } as any);
    window.addEventListener("mousemove", onMove as any, { passive: true } as any);
    return () => {
      window.removeEventListener("pointermove", onMove as any);
      window.removeEventListener("mousemove", onMove as any);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  if (!active) return null;

  const left = Math.max(8, pos.x + 14);
  const top = Math.max(8, pos.y + 14);

  return (
    <>
      <style>{`
        @keyframes sairyneSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          left,
          top,
          zIndex: 2147483647,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.25)",
            borderTopColor: "rgba(255,255,255,0.95)",
            animation: "sairyneSpin 0.8s linear infinite",
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))",
          }}
        />
      </div>
    </>
  );
}


