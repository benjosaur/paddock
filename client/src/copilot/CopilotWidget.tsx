import { FormEvent, useEffect, useRef, useState } from "react";
import { MousePointer2, SendHorizontal, Sparkles, Square, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useCopilot, CopilotEntry } from "./useCopilot";
import type { CursorHandle } from "./CopilotCursor";
import type { UserRole } from "../types";

function Entry({ entry }: { entry: CopilotEntry }) {
  if (entry.kind === "user") {
    return (
      <p className="ml-8 rounded-lg bg-gray-800 px-3 py-2 text-sm text-white">
        {entry.text}
      </p>
    );
  }
  if (entry.kind === "assistant") {
    return (
      <p className="mr-8 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-800">
        {entry.text}
      </p>
    );
  }
  if (entry.kind === "action") {
    return (
      <p className="flex items-center gap-1.5 text-xs italic text-gray-500">
        <MousePointer2 className="h-3 w-3 shrink-0" />
        {entry.text}
      </p>
    );
  }
  return <p className="text-xs text-red-600">{entry.text}</p>;
}

export function CopilotWidget({
  role,
  cursorRef,
}: {
  role: UserRole;
  cursorRef: { current: CursorHandle | null };
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const { entries, busy, status, send, stop } = useCopilot(role, cursorRef);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries, status]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy || !draft.trim()) return;
    const text = draft;
    setDraft("");
    void send(text);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-[60] flex max-h-[70vh] w-96 flex-col overflow-hidden rounded-xl border border-gray-200/60 bg-white/95 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-gray-200/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gray-700" />
              <span className="text-sm font-semibold text-gray-800">
                Paddock Copilot
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close copilot"
              className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
            {entries.length === 0 && (
              <p className="text-sm text-gray-500">
                Ask me to drive the app for you — e.g.{" "}
                <span className="italic">“Show MPs sorted by fee date”</span>.
                You&apos;ll see a cursor do the clicking.
              </p>
            )}
            {entries.map((entry) => (
              <Entry key={entry.id} entry={entry} />
            ))}
            {status && (
              <p className="flex animate-pulse items-center gap-1.5 text-xs text-gray-500">
                <MousePointer2 className="h-3 w-3 shrink-0" />
                {status}
              </p>
            )}
          </div>

          <form
            onSubmit={submit}
            className="flex items-center gap-2 border-t border-gray-200/60 p-3"
          >
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask the copilot…"
              disabled={busy}
              className="h-9 text-sm"
            />
            {busy ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={stop}
                aria-label="Stop the copilot"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!draft.trim()}
                aria-label="Send"
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            )}
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close copilot" : "Open copilot"}
        className="fixed bottom-6 right-6 z-[60] flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition-transform duration-150 hover:scale-105"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>
    </>
  );
}
