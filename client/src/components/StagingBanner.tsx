import { useEffect } from "react";

const isStaging = import.meta.env.VITE_STAGE === "staging";

// Environment indicator baked into staging builds only: a slim ribbon, a
// [STAGING] tab title and a noindex meta tag. Prod builds render nothing.
export function StagingBanner() {
  useEffect(() => {
    if (!isStaging) return;
    const previousTitle = document.title;
    document.title = `[STAGING] ${previousTitle}`;
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => {
      document.title = previousTitle;
      meta.remove();
    };
  }, []);

  if (!isStaging) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 bg-amber-500 py-0.5 text-center text-xs font-semibold tracking-wide text-white">
      STAGING — test data only
    </div>
  );
}
