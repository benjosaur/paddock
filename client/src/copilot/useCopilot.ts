import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "../utils/trpc";
import { useConfig } from "../hooks/useConfig";
import type {
  CopilotCatalog,
  CopilotMessage,
  CopilotToolResultBlock,
  CopilotToolUseBlock,
  UserRole,
} from "../types";
import { buildCatalog, buildSnapshot, describeTarget } from "./registry";
import { executeToolUse } from "./executor";
import { startToastCapture, stopToastCapture } from "./toastCapture";
import type { CursorHandle } from "./CopilotCursor";

export interface CopilotEntry {
  id: string;
  kind: "user" | "assistant" | "action" | "error";
  text: string;
}

// Not a product limit — a runaway backstop so a pathological model loop
// can't burn tokens unattended. The stop button is the real control.
const RUNAWAY_TURN_LIMIT = 50;
// Target size for replayed history (the active request is never trimmed).
const MAX_WIRE_MESSAGES = 30;

function isUserTextMessage(message: CopilotMessage): boolean {
  return message.role === "user" && message.content[0]?.type === "text";
}

// Drop oldest turns, keeping two invariants: the head stays a plain user
// text message (so tool_use blocks never lose their paired tool_result) and
// everything from the ACTIVE request's user message onward is untouchable —
// a long action chain must not trim away its own goal mid-loop.
function trimWire(messages: CopilotMessage[]): CopilotMessage[] {
  let activeStart = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (isUserTextMessage(messages[i])) {
      activeStart = i;
      break;
    }
  }
  let history = messages.slice(0, activeStart);
  const active = messages.slice(activeStart);
  while (history.length + active.length > MAX_WIRE_MESSAGES && history.length) {
    history = history.slice(1);
    while (history.length && !isUserTextMessage(history[0])) {
      history = history.slice(1);
    }
  }
  return [...history, ...active];
}

function describeAction(
  toolUse: CopilotToolUseBlock,
  catalog: CopilotCatalog,
): string {
  const target = describeTarget(
    typeof toolUse.input.target_id === "string" ? toolUse.input.target_id : "",
    catalog,
  );
  return toolUse.name === "ui_type"
    ? `Typing “${typeof toolUse.input.text === "string" ? toolUse.input.text : ""}” into ${target}`
    : `Clicking ${target}`;
}

export function useCopilot(
  role: UserRole,
  cursorRef: { current: CursorHandle | null },
) {
  const config = useConfig();
  const [entries, setEntries] = useState<CopilotEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const wireRef = useRef<CopilotMessage[]>([]);
  const abortRef = useRef(false);

  const chat = useMutation(
    trpc.copilot.chat.mutationOptions({
      // Override the global mutation toasts from utils/trpc.ts — copilot
      // feedback lives in the chat panel.
      onSuccess: () => {},
      onError: () => {},
    }),
  );

  const push = (kind: CopilotEntry["kind"], text: string) =>
    setEntries((prev) => [...prev, { id: crypto.randomUUID(), kind, text }]);

  async function send(text: string) {
    const trimmedText = text.trim();
    if (!trimmedText || busy) return;
    setBusy(true);
    abortRef.current = false;
    push("user", trimmedText);
    // No toast popups while the copilot works: toasts are captured into the
    // tool results as app feedback instead of appearing over the screen.
    startToastCapture();

    const catalog = buildCatalog(role, config);
    const wire: CopilotMessage[] = [
      ...wireRef.current,
      { role: "user", content: [{ type: "text", text: trimmedText }] },
    ];

    try {
      for (let turn = 0; turn < RUNAWAY_TURN_LIMIT; turn++) {
        if (abortRef.current) break;
        setStatus("Thinking…");
        const response = await chat.mutateAsync({
          messages: trimWire(wire),
          catalog,
          snapshot: buildSnapshot(),
        });
        wire.push({ role: "assistant", content: response.content });

        for (const block of response.content) {
          if (block.type === "text" && block.text.trim()) {
            push("assistant", block.text.trim());
          }
        }

        const toolUses = response.content.filter(
          (block): block is CopilotToolUseBlock => block.type === "tool_use",
        );
        if (toolUses.length === 0) break;

        const results: CopilotToolResultBlock[] = [];
        let failed = false;
        cursorRef.current?.show();
        for (const toolUse of toolUses) {
          if (abortRef.current || failed) {
            results.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: abortRef.current
                ? "Not executed: the user stopped the copilot."
                : "Not executed: a previous action failed.",
              is_error: true,
            });
            continue;
          }
          const label = describeAction(toolUse, catalog);
          setStatus(label);
          push("action", label);
          const actionResult = await executeToolUse(toolUse, cursorRef.current);
          if (actionResult.is_error) {
            failed = true;
            push("error", actionResult.content);
          }
          results.push(actionResult);
        }
        // Always answer every tool_use so the replayed conversation stays
        // valid, even when stopping early.
        wire.push({ role: "user", content: results });
        if (abortRef.current) break;
        if (turn === RUNAWAY_TURN_LIMIT - 1) {
          push("error", "Stopped a runaway action loop — try rephrasing the request.");
        }
      }
    } catch (error) {
      push(
        "error",
        `Copilot request failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    } finally {
      stopToastCapture();
      cursorRef.current?.hide();
      wireRef.current = trimWire(wire);
      setStatus(null);
      setBusy(false);
    }
  }

  const stop = () => {
    abortRef.current = true;
  };

  return { entries, busy, status, send, stop };
}
