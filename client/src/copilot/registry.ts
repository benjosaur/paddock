import { configurableTableIds } from "shared/const";
import { getVisibleMenuItems } from "../utils/permissions";
import { tableRegistry, ConfigurableTableId } from "../utils/tableRegistry";
import type {
  AppConfig,
  CopilotCatalog,
  CopilotSnapshot,
  CopilotSortState,
  UserRole,
} from "../types";
import { discoverFields, isVisible } from "./fields";

// What each page is for, in the model's terms. Keys match menu item keys.
const PAGE_DESCRIPTIONS: Record<string, string> = {
  dashboard: "Overview of activity and key stats.",
  requests: "Care Requests table, with Care and Information tabs.",
  packages:
    "Care Confirmed (agreed care packages) table, with tabs for request-linked and independent packages.",
  clients: "Clients (care recipients) table.",
  mps: "MPs (paid care providers) table.",
  volunteers: "Volunteers table.",
  dbs: "DBS records: separate MPs and Volunteers tables sorted by DBS expiry.",
  "public-liability":
    "Insurance records: separate MPs and Volunteers tables sorted by public liability expiry.",
  records: "Training records: separate MPs and Volunteers tables.",
  mag: "MAG (Memory Activity Group) session logs table.",
  hubGrub: "Hub & Grub session logs table.",
  settings: "Admin settings: dropdown options and table column visibility.",
};

// Mirrors DataTable's column-visibility rule: an explicit config list wins,
// otherwise all non-defaultHidden columns are shown.
function visibleColumnsFor(tableId: ConfigurableTableId, config: AppConfig) {
  const registryEntry = tableRegistry[tableId];
  const visibleKeys = config.tableColumns.visibleColumns[tableId];
  return visibleKeys
    ? registryEntry.columns.filter((col) => visibleKeys.includes(col.key))
    : registryEntry.columns.filter((col) => !col.defaultHidden);
}

export function buildCatalog(role: UserRole, config: AppConfig): CopilotCatalog {
  const pages = getVisibleMenuItems(role).map((item) => ({
    key: item.key,
    label: item.label,
    path: item.path,
    navTargetId: `nav.${item.key}`,
    description: PAGE_DESCRIPTIONS[item.key] ?? "",
  }));
  const pageKeys = new Set(pages.map((page) => page.key));

  // Table ids double as the menu key of the page hosting them, so a table is
  // only offered when its page is visible to this role.
  const tables = configurableTableIds
    .filter((tableId) => pageKeys.has(tableId))
    .map((tableId) => ({
      tableId,
      label: tableRegistry[tableId].label,
      pageKey: tableId,
      searchTargetId: `search.${tableId}`,
      columns: visibleColumnsFor(tableId, config).map((col) => ({
        key: col.key,
        header: col.header,
        sortTargetId: `sort.${tableId}.${col.key}`,
      })),
    }));

  return { pages, tables };
}

export function buildSnapshot(): CopilotSnapshot {
  const targets = Array.from(
    document.querySelectorAll<HTMLElement>("[data-copilot-id]"),
  ).filter(isVisible);

  const visibleTargetIds = Array.from(
    new Set(targets.map((el) => el.dataset.copilotId ?? "")),
  )
    .filter(Boolean)
    .slice(0, 200);

  let sort: CopilotSortState | null = null;
  const sortedHeader = targets.find(
    (el) =>
      el.getAttribute("aria-sort") &&
      (el.dataset.copilotId ?? "").startsWith("sort."),
  );
  if (sortedHeader) {
    const [, tableId, ...keyParts] = (
      sortedHeader.dataset.copilotId as string
    ).split(".");
    if ((configurableTableIds as readonly string[]).includes(tableId)) {
      sort = {
        tableId: tableId as ConfigurableTableId,
        columnKey: keyParts.join("."),
        direction:
          sortedHeader.getAttribute("aria-sort") === "descending"
            ? "desc"
            : "asc",
      };
    }
  }

  const searchInput = targets.find((el) =>
    (el.dataset.copilotId ?? "").startsWith("search."),
  );

  const tableEl = Array.from(
    document.querySelectorAll<HTMLElement>("table[data-copilot-table]"),
  ).find(isVisible);
  const rows = tableEl
    ? Array.from(tableEl.querySelectorAll("tbody tr"))
        .slice(0, 40)
        .map((tr, index) => ({
          index,
          label: (tr.querySelector("td")?.textContent ?? "").trim().slice(0, 60),
          // Record-keyed actions-menu target, read from the row itself so a
          // reorder between snapshot and click cannot retarget another record.
          actionsTargetId: tr.querySelector<HTMLElement>(
            '[data-copilot-id^="rowactions."]',
          )?.dataset.copilotId,
        }))
    : [];

  const fields = discoverFields().map(({ targetId, label, value, kind }) => ({
    targetId,
    label,
    value: value.slice(0, 120),
    kind,
  }));

  const filters = targets
    .filter(
      (el): el is HTMLInputElement =>
        el instanceof HTMLInputElement &&
        (el.dataset.copilotId ?? "").startsWith("filter.") &&
        el.value !== "",
    )
    .map((el) => ({ targetId: el.dataset.copilotId as string, value: el.value }));

  return {
    path: window.location.pathname,
    visibleTargetIds,
    sort,
    searchTerm:
      searchInput instanceof HTMLInputElement ? searchInput.value : "",
    rows,
    fields,
    filters,
  };
}

export function describeTarget(
  targetId: string,
  catalog: CopilotCatalog,
): string {
  const [kind, ...rest] = targetId.split(".");
  if (kind === "nav") {
    const page = catalog.pages.find((p) => p.navTargetId === targetId);
    if (page) return `“${page.label}” in the menu`;
  }
  if (kind === "sort") {
    const [tableId, ...keyParts] = rest;
    const table = catalog.tables.find((t) => t.tableId === tableId);
    const column = table?.columns.find((c) => c.key === keyParts.join("."));
    if (column) return `the “${column.header}” column header`;
  }
  if (kind === "search") {
    const table = catalog.tables.find((t) => t.searchTargetId === targetId);
    if (table) return `the ${table.label} search box`;
  }
  if (kind === "rowactions") {
    const table = catalog.tables.find((t) => t.tableId === rest[0]);
    return `a ${table?.label ?? ""} row's actions menu`.replace("  ", " ");
  }
  if (kind === "rowmenu") {
    return `“${rest.join(".")}” in the row menu`;
  }
  return `“${targetId}”`;
}
