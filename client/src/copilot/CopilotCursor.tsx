import { useEffect, useRef } from "react";
import { MousePointer2 } from "lucide-react";

export interface CursorHandle {
  show: () => void;
  hide: () => void;
  moveTo: (x: number, y: number) => Promise<void>;
  click: () => Promise<void>;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The virtual cursor the copilot moves over the real UI. Driven imperatively
// (WAAPI on a fixed overlay) so animation never re-renders the app; sits at
// z-[70], above the app-wide z-50 overlay ceiling and the z-[60] widget.
export function CopilotCursor({
  handleRef,
}: {
  handleRef: { current: CursorHandle | null };
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const pointer = pointerRef.current;
    if (!root || !pointer) return;

    const pos = { x: window.innerWidth - 72, y: window.innerHeight - 72 };
    const apply = () => {
      root.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    };
    apply();

    handleRef.current = {
      show: () => {
        root.style.opacity = "1";
      },
      hide: () => {
        root.style.opacity = "0";
      },
      moveTo: async (x, y) => {
        const from = { ...pos };
        const distance = Math.hypot(x - from.x, y - from.y);
        if (distance < 1) return;
        pos.x = x;
        pos.y = y;
        const animation = root.animate(
          [
            { transform: `translate(${from.x}px, ${from.y}px)` },
            { transform: `translate(${x}px, ${y}px)` },
          ],
          {
            duration: Math.min(900, Math.max(250, distance * 0.8)),
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          },
        );
        try {
          await animation.finished;
        } catch {
          // Animation was cancelled (e.g. overlay unmounted mid-run).
        }
        apply();
      },
      click: async () => {
        const ripple = document.createElement("span");
        Object.assign(ripple.style, {
          position: "absolute",
          left: "-14px",
          top: "-14px",
          width: "28px",
          height: "28px",
          borderRadius: "9999px",
          border: "2px solid rgb(37, 99, 235)",
          pointerEvents: "none",
        });
        root.appendChild(ripple);
        ripple.animate(
          [
            { transform: "scale(0.35)", opacity: 0.9 },
            { transform: "scale(2.1)", opacity: 0 },
          ],
          { duration: 450, easing: "ease-out", fill: "forwards" },
        );
        pointer.animate(
          [
            { transform: "translate(-4px, -4px) scale(1)" },
            { transform: "translate(-4px, -4px) scale(0.82)" },
            { transform: "translate(-4px, -4px) scale(1)" },
          ],
          { duration: 220, easing: "ease-in-out" },
        );
        await sleep(300);
        ripple.remove();
      },
    };

    return () => {
      handleRef.current = null;
    };
  }, [handleRef]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[70] opacity-0 transition-opacity duration-300"
    >
      {/* Offset so the pointer's visual tip sits on the tracked point. */}
      <span
        ref={pointerRef}
        className="block"
        style={{ transform: "translate(-4px, -4px)" }}
      >
        <MousePointer2
          className="h-6 w-6 text-white drop-shadow-md"
          fill="rgb(17, 24, 39)"
          strokeWidth={1.5}
        />
      </span>
    </div>
  );
}
