// Generic, zero-instrumentation discovery of form fields: labels drive it,
// so any page built from the app's <label> + <Input>/<Select> pattern is
// editable by the copilot without per-form changes.

export function isVisible(el: HTMLElement): boolean {
  if (typeof el.checkVisibility === "function" && !el.checkVisibility()) {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

export interface DiscoveredField {
  targetId: string;
  label: string;
  value: string;
  kind: "text" | "date" | "textarea" | "select" | "readonly";
  // Element to click (input, or the react-select container).
  el: HTMLElement;
  // Element to type into (the inner input for selects).
  typeTarget: HTMLInputElement | HTMLTextAreaElement | null;
}

const SKIPPED_INPUT_TYPES = new Set([
  "hidden",
  "checkbox",
  "radio",
  "file",
  "button",
  "submit",
  "reset",
]);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// react-select renders a container div whose inner input is a combobox.
function selectInnerInput(el: Element): HTMLInputElement | null {
  return el.querySelector<HTMLInputElement>(
    'input[role="combobox"], input[aria-autocomplete="list"]',
  );
}

export function discoverFields(): DiscoveredField[] {
  const out: DiscoveredField[] = [];
  const usedSlugs = new Set<string>();
  const claimed = new Set<Element>();

  const push = (labelText: string, control: HTMLElement | null) => {
    if (!control || claimed.has(control) || !isVisible(control)) return;

    let kind: DiscoveredField["kind"];
    let typeTarget: DiscoveredField["typeTarget"];
    let value: string;

    if (control instanceof HTMLInputElement) {
      if (SKIPPED_INPUT_TYPES.has(control.type)) return;
      if (control.dataset.copilotId) return; // e.g. the table search box
      kind = control.readOnly
        ? "readonly"
        : control.type === "date"
          ? "date"
          : "text";
      typeTarget = control;
      value = control.value;
    } else if (control instanceof HTMLTextAreaElement) {
      kind = "textarea";
      typeTarget = control;
      value = control.value;
    } else {
      const inner = selectInnerInput(control);
      if (!inner) return;
      kind = "select";
      typeTarget = inner;
      value =
        control.querySelector('[class*="singleValue"]')?.textContent?.trim() ??
        "";
    }

    claimed.add(control);
    const base = slugify(labelText) || "field";
    let slug = base;
    for (let i = 2; usedSlugs.has(slug); i++) slug = `${base}-${i}`;
    usedSlugs.add(slug);
    out.push({
      targetId: `field.${slug}`,
      label: labelText.trim(),
      value,
      kind,
      el: control,
      typeTarget,
    });
  };

  // Pass 1 — labelled controls (htmlFor/nesting via label.control, htmlFor
  // pointing at a react-select container, or a following-sibling control).
  document.querySelectorAll("label").forEach((label) => {
    if (!isVisible(label)) return;
    const text = label.textContent?.replace(/\*/g, "").trim() ?? "";
    if (!text) return;

    let control: HTMLElement | null = label.control as HTMLElement | null;
    if (!control && label.htmlFor) {
      control = document.getElementById(label.htmlFor);
    }
    if (!control) {
      let sibling = label.nextElementSibling;
      while (sibling && !control) {
        if (
          sibling instanceof HTMLInputElement ||
          sibling instanceof HTMLTextAreaElement ||
          selectInnerInput(sibling)
        ) {
          control = sibling as HTMLElement;
        } else {
          control =
            sibling.querySelector<HTMLElement>("input, textarea") ?? null;
          sibling = sibling.nextElementSibling;
        }
      }
    }
    push(text, control);
  });

  // Pass 2 — unlabelled inputs inside open dialogs (e.g. field edit modals),
  // labelled by the dialog's title.
  document.querySelectorAll<HTMLElement>('[role="dialog"]').forEach((dialog) => {
    if (!isVisible(dialog)) return;
    const title = dialog.querySelector("h2")?.textContent?.trim() || "Dialog";
    dialog
      .querySelectorAll<HTMLElement>("input, textarea")
      .forEach((el) => push(title, el));
  });

  return out.slice(0, 80);
}
