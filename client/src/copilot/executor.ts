import type {
  CopilotActionReport,
  CopilotToolResultBlock,
  CopilotToolUseBlock,
} from "../types";
import type { CursorHandle } from "./CopilotCursor";
import { discoverFields, isVisible, type DiscoveredField } from "./fields";
import { drainCapturedToasts } from "./toastCapture";

// How long the executor waits after an action so navigation/re-render can
// settle before the next snapshot is taken.
const SETTLE_MS = 400;
const TARGET_TIMEOUT_MS = 4000;
const TARGET_ID_PATTERN = /^[\w.-]+$/;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

function currentUiState(): CopilotActionReport["state"] {
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
  return { path: window.location.pathname, sort, dialogOpen };
}

const MAX_DIFF_IDS = 8;

function visibleTargetIdSet(): Set<string> {
  return new Set(
    Array.from(document.querySelectorAll<HTMLElement>("[data-copilot-id]"))
      .filter(isVisible)
      .map((el) => el.dataset.copilotId ?? "")
      .filter(Boolean),
  );
}

function capIdList(ids: string[]): string[] {
  return ids.length > MAX_DIFF_IDS
    ? [...ids.slice(0, MAX_DIFF_IDS), `+${ids.length - MAX_DIFF_IDS} more`]
    : ids;
}

// Every return path — success or error — goes through here, producing the
// JSON report contract defined in shared/schemas/copilot.ts. The appeared/
// disappeared diff against `before` is what lets the model attribute what
// the next snapshot shows to the action it just took (otherwise it reads
// its own effect as pre-existing state), and draining notifications here,
// unconditionally, keeps a toast raised around a failed action from being
// misattributed to the next successful one.
function report(
  toolUse: CopilotToolUseBlock,
  before: Set<string> | null,
  extra: Partial<Pick<CopilotActionReport, "error" | "value">> = {},
): CopilotToolResultBlock {
  const after = before ? visibleTargetIdSet() : null;
  const body: CopilotActionReport = {
    ok: extra.error === undefined,
    action: toolUse.name === "ui_type" ? "type" : "click",
    target:
      typeof toolUse.input.target_id === "string" ? toolUse.input.target_id : "",
    ...extra,
    state: currentUiState(),
    appeared:
      after && before
        ? capIdList([...after].filter((id) => !before.has(id)))
        : [],
    disappeared:
      after && before
        ? capIdList([...before].filter((id) => !after.has(id)))
        : [],
    notifications: drainCapturedToasts(),
  };
  return {
    type: "tool_result",
    tool_use_id: toolUse.id,
    content: JSON.stringify(body),
    ...(body.ok ? {} : { is_error: true }),
  };
}

// For the chat panel: recover the structured report from a result block.
export function parseActionReport(
  content: string,
): CopilotActionReport | null {
  try {
    return JSON.parse(content) as CopilotActionReport;
  } catch {
    return null;
  }
}

// Synthetic result for tool_uses skipped after a stop or a failed sibling,
// kept in the same JSON report shape the model is told to expect.
export function notExecutedResult(
  toolUse: CopilotToolUseBlock,
  reason: string,
): CopilotToolResultBlock {
  return report(toolUse, null, { error: reason });
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
  before: Set<string>,
): Promise<CopilotToolResultBlock> {
  if (field.kind === "readonly") {
    return report(toolUse, before, {
      error: `"${field.label}" is read-only. ui_click its field target to open its edit dialog, fill the dialog's field, then ask the user to apply it.`,
    });
  }
  if (!field.typeTarget) {
    return report(toolUse, before, {
      error: `"${field.label}" cannot be typed into.`,
    });
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
  return report(toolUse, before, { value: after });
}

export async function executeToolUse(
  toolUse: CopilotToolUseBlock,
  cursor: CursorHandle | null,
): Promise<CopilotToolResultBlock> {
  const targetId =
    typeof toolUse.input.target_id === "string" ? toolUse.input.target_id : "";
  if (!TARGET_ID_PATTERN.test(targetId)) {
    return report(toolUse, null, { error: "Invalid or missing target_id." });
  }

  const isField = targetId.startsWith("field.");
  const field = isField ? await waitForField(targetId) : null;
  const el = isField ? (field?.el ?? null) : await waitForTarget(targetId);
  if (!el) {
    return report(toolUse, null, {
      error: `Target "${targetId}" is not on screen. Check the snapshot and navigate to the right page first.`,
    });
  }

  const before = visibleTargetIdSet();

  if (toolUse.name === "ui_click") {
    if (isCommitButton(el)) {
      return report(toolUse, before, {
        error:
          "Blocked: that button saves or submits changes, which is reserved for the user. Ask them to review and press it themselves.",
      });
    }
    await moveCursorTo(el, cursor);
    await cursor?.click();
    el.click();
    await sleep(SETTLE_MS);
    return report(toolUse, before);
  }

  if (toolUse.name === "ui_type") {
    const text =
      typeof toolUse.input.text === "string" ? toolUse.input.text : "";
    if (field) {
      return typeIntoField(toolUse, field, text, cursor, before);
    }
    if (
      !(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
    ) {
      return report(toolUse, before, {
        error: `Target "${targetId}" is not a text input.`,
      });
    }
    await moveCursorTo(el, cursor);
    await cursor?.click();
    el.focus();
    setNativeValue(el, text);
    await sleep(SETTLE_MS);
    return report(toolUse, before, { value: el.value });
  }

  return report(toolUse, before, { error: `Unknown tool "${toolUse.name}".` });
}
