import type { CopilotToolResultBlock, CopilotToolUseBlock } from "../types";
import type { CursorHandle } from "./CopilotCursor";

// How long the executor waits after an action so navigation/re-render can
// settle before the next snapshot is taken.
const SETTLE_MS = 400;
const TARGET_TIMEOUT_MS = 4000;
const TARGET_ID_PATTERN = /^[\w.-]+$/;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function isVisible(el: HTMLElement): boolean {
  if (typeof el.checkVisibility === "function" && !el.checkVisibility()) {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

// The same target id can exist twice (e.g. nav links in the hidden mobile
// drawer and the desktop sidebar) — always act on a visible instance.
async function waitForTarget(targetId: string): Promise<HTMLElement | null> {
  const deadline = Date.now() + TARGET_TIMEOUT_MS;
  const selector = `[data-copilot-id="${targetId}"]`;
  while (Date.now() < deadline) {
    const match = Array.from(
      document.querySelectorAll<HTMLElement>(selector),
    ).find(isVisible);
    if (match) return match;
    await sleep(120);
  }
  return null;
}

// React controlled inputs ignore direct .value writes; go through the native
// setter so the change event React listens for actually fires.
function setNativeValue(
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function result(
  toolUse: CopilotToolUseBlock,
  content: string,
  isError = false,
): CopilotToolResultBlock {
  return {
    type: "tool_result",
    tool_use_id: toolUse.id,
    content,
    ...(isError ? { is_error: true } : {}),
  };
}

export async function executeToolUse(
  toolUse: CopilotToolUseBlock,
  cursor: CursorHandle | null,
): Promise<CopilotToolResultBlock> {
  const targetId =
    typeof toolUse.input.target_id === "string" ? toolUse.input.target_id : "";
  if (!TARGET_ID_PATTERN.test(targetId)) {
    return result(toolUse, "Invalid or missing target_id.", true);
  }

  const el = await waitForTarget(targetId);
  if (!el) {
    return result(
      toolUse,
      `Target "${targetId}" is not on screen. Check the snapshot and navigate to the right page first.`,
      true,
    );
  }

  el.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
  await sleep(80);
  const rect = el.getBoundingClientRect();
  await cursor?.moveTo(rect.left + rect.width / 2, rect.top + rect.height / 2);

  if (toolUse.name === "ui_click") {
    await cursor?.click();
    el.click();
    await sleep(SETTLE_MS);
    return result(toolUse, `Clicked ${targetId}.`);
  }

  if (toolUse.name === "ui_type") {
    const text = typeof toolUse.input.text === "string" ? toolUse.input.text : "";
    if (
      !(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
    ) {
      return result(toolUse, `Target "${targetId}" is not a text input.`, true);
    }
    await cursor?.click();
    el.focus();
    setNativeValue(el, text);
    await sleep(SETTLE_MS);
    return result(toolUse, `Typed "${text}" into ${targetId}.`);
  }

  return result(toolUse, `Unknown tool "${toolUse.name}".`, true);
}
