import type { CopilotMessage } from "../types";

// Target size for the replayed conversation sent with each request.
export const MAX_WIRE_MESSAGES = 30;

function isUserTextMessage(message: CopilotMessage): boolean {
  return message.role === "user" && message.content[0]?.type === "text";
}

// Drop oldest turns, keeping two invariants: the head stays a plain user
// text message (so tool_use blocks never lose their paired tool_result) and
// the ACTIVE request's goal message is never dropped.
export function trimWire(messages: CopilotMessage[]): CopilotMessage[] {
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
  // Cliff guard: a single request longer than the whole budget (~15 tool
  // turns) has no user-text boundary inside it, so without this the NEXT
  // request would trim away the entire conversation in one step. Instead
  // drop the run's oldest completed turns pairwise (assistant tool_use +
  // its tool_results message) — the goal message always survives and the
  // pairing keeps the replayed history valid.
  if (history.length === 0 && active.length > MAX_WIRE_MESSAGES) {
    const goal = active[0];
    let turns = active.slice(1);
    while (turns.length + 1 > MAX_WIRE_MESSAGES && turns.length >= 2) {
      turns = turns.slice(2);
    }
    return [goal, ...turns];
  }
  return [...history, ...active];
}
