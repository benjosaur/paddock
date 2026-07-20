import type { CopilotToolResultBlock, CopilotToolUseBlock } from "../types";
import type { CursorHandle } from "./CopilotCursor";
import { discoverFields, isVisible, type DiscoveredField } from "./fields";

// How long the executor waits after an action so navigation/re-render can
// settle before the next snapshot is taken.
const SETTLE_MS = 400;
const TARGET_TIMEOUT_MS = 4000;
const TARGET_ID_PATTERN = /^[\w.-]+$/;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export { isVisible };

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

async function waitForField(targetId: string): Promise<DiscoveredField | null> {
  const deadline = Date.now() + TARGET_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const match = discoverFields().find((f) => f.targetId === targetId);
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

// One-line state readout appended to every successful tool result, so the
// model can attribute what the next snapshot shows to the action it just
// took (otherwise it reads its own effect as pre-existing state).
function currentUiState(): string {
  const sortedHeader = Array.from(
    document.querySelectorAll<HTMLElement>('[data-copilot-id^="sort."]'),
  ).find((el) => el.getAttribute("aria-sort") && isVisible(el));
  const sort = sortedHeader
    ? `${(sortedHeader.dataset.copilotId ?? "").replace(/^sort\./, "")} ${
        sortedHeader.getAttribute("aria-sort") === "descending"
          ? "descending"
          : "ascending"
      }`
    : "none";
  const dialogOpen = Array.from(
    document.querySelectorAll<HTMLElement>('[role="dialog"]'),
  ).some(isVisible);
  return `path=${window.location.pathname}, sort=${sort}, dialogOpen=${dialogOpen}`;
}

// HITL guard: committing buttons (form Save/Submit and dialog confirms) are
// never instrumented, so they normally can't be targeted at all — this is
// the backstop in case one ever ends up resolvable.
function isCommitButton(el: HTMLElement): boolean {
  const button = el.closest("button");
  return !!button && button.type === "submit" && !!button.form;
}

async function moveCursorTo(el: HTMLElement, cursor: CursorHandle | null) {
  el.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
  await sleep(80);
  const rect = el.getBoundingClientRect();
  await cursor?.moveTo(rect.left + rect.width / 2, rect.top + rect.height / 2);
}

async function typeIntoField(
  toolUse: CopilotToolUseBlock,
  field: DiscoveredField,
  text: string,
  cursor: CursorHandle | null,
): Promise<CopilotToolResultBlock> {
  if (field.kind === "readonly") {
    return result(
      toolUse,
      `"${field.label}" is read-only. ui_click its field target to open its edit dialog, fill the dialog's field, then ask the user to apply it.`,
      true,
    );
  }
  if (!field.typeTarget) {
    return result(toolUse, `"${field.label}" cannot be typed into.`, true);
  }

  await moveCursorTo(field.el, cursor);
  await cursor?.click();
  field.typeTarget.focus();
  setNativeValue(field.typeTarget, text);

  if (field.kind === "select") {
    // react-select: typing filters the options; Enter picks the focused
    // (closest-matching) one.
    await sleep(250);
    field.typeTarget.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    );
  }

  await sleep(SETTLE_MS);
  const after =
    discoverFields().find((f) => f.targetId === field.targetId)?.value ?? "";
  return result(
    toolUse,
    `Typed "${text}" into "${field.label}". Its value is now "${after}". Effect: ${currentUiState()}.`,
  );
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

  const isField = targetId.startsWith("field.");
  const field = isField ? await waitForField(targetId) : null;
  const el = isField ? (field?.el ?? null) : await waitForTarget(targetId);
  if (!el) {
    return result(
      toolUse,
      `Target "${targetId}" is not on screen. Check the snapshot and navigate to the right page first.`,
      true,
    );
  }

  if (toolUse.name === "ui_click") {
    if (isCommitButton(el)) {
      return result(
        toolUse,
        "Blocked: that button saves or submits changes, which is reserved for the user. Ask them to review and press it themselves.",
        true,
      );
    }
    await moveCursorTo(el, cursor);
    await cursor?.click();
    el.click();
    await sleep(SETTLE_MS);
    return result(
      toolUse,
      `Clicked ${targetId}. Effect of this click: ${currentUiState()}.`,
    );
  }

  if (toolUse.name === "ui_type") {
    const text =
      typeof toolUse.input.text === "string" ? toolUse.input.text : "";
    if (field) {
      return typeIntoField(toolUse, field, text, cursor);
    }
    if (
      !(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
    ) {
      return result(toolUse, `Target "${targetId}" is not a text input.`, true);
    }
    await moveCursorTo(el, cursor);
    await cursor?.click();
    el.focus();
    setNativeValue(el, text);
    await sleep(SETTLE_MS);
    return result(
      toolUse,
      `Typed "${text}" into ${targetId}. Effect: ${currentUiState()}.`,
    );
  }

  return result(toolUse, `Unknown tool "${toolUse.name}".`, true);
}
