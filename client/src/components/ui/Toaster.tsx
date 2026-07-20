import { useLayoutEffect } from "react";
import toast, { Toaster as HotToaster, useToasterStore } from "react-hot-toast";
import { captureToast, useToastCapturing } from "../../copilot/toastCapture";

export function Toaster() {
  const { toasts } = useToasterStore();
  const capturing = useToastCapturing();

  // While the copilot drives the UI, divert toasts into its capture buffer
  // (they resurface as tool-result feedback) before the browser paints them.
  useLayoutEffect(() => {
    if (!capturing) return;
    for (const t of toasts) {
      if (captureToast(t)) toast.remove(t.id);
    }
  }, [capturing, toasts]);

  if (capturing) return null;
  return (
    <HotToaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: "var(--background)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
        },
        success: {
          duration: 3000,
          style: {
            background: "var(--background)",
            border: "1px solid var(--success)",
          },
        },
        error: {
          duration: 5000,
          style: {
            background: "var(--background)",
            border: "1px solid var(--destructive)",
          },
        },
      }}
    />
  );
}
