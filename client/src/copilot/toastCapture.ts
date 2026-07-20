import { useSyncExternalStore } from "react";
import toast, { resolveValue, type Toast } from "react-hot-toast";

// While the copilot is driving the UI, app toasts must not pop over the
// screen — but they carry the app's own feedback about the copilot's actions
// (e.g. rejecting a duplicate dropdown option), which the model otherwise
// cannot see. So for the duration of a copilot run the Toaster diverts every
// new toast here, and the executor folds the buffer into each tool result.

export interface CapturedToast {
  severity: "success" | "error" | "notice";
  text: string;
}

let capturing = false;
let startedAt = 0;
let seenIds = new Set<string>();
let buffer: CapturedToast[] = [];
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

export function useToastCapturing(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => capturing,
  );
}

export function startToastCapture() {
  capturing = true;
  startedAt = Date.now();
  seenIds = new Set();
  buffer = [];
  notify();
}

// Anything still buffered arrived after the last action's drain (e.g. a slow
// async mutation) — re-emit it so late feedback is not silently lost.
export function stopToastCapture() {
  if (!capturing) return;
  capturing = false;
  const undelivered = buffer;
  buffer = [];
  notify();
  for (const captured of undelivered) {
    if (captured.severity === "success") toast.success(captured.text);
    else if (captured.severity === "error") toast.error(captured.text);
    else toast(captured.text);
  }
}

export function drainCapturedToasts(): CapturedToast[] {
  const drained = buffer;
  buffer = [];
  return drained;
}

// Returns true when the toast belongs to this capture window and must be
// removed from the store; toasts predating the run are left alone.
export function captureToast(t: Toast): boolean {
  if (!capturing || t.createdAt < startedAt || seenIds.has(t.id)) return false;
  seenIds.add(t.id);
  // Loading spinners are transient noise; their resolution arrives as a
  // separate success/error toast.
  if (t.type !== "loading") {
    const message = resolveValue(t.message, t);
    buffer.push({
      severity:
        t.type === "success" || t.type === "error" ? t.type : "notice",
      text: typeof message === "string" ? message : "(app notification)",
    });
  }
  return true;
}
