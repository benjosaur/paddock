// The column-visibility rule shared by DataTable rendering and the copilot
// catalog (which must agree on what is on screen): an explicit config list
// wins, otherwise all non-defaultHidden columns are shown.
//
// This lives in its own leaf module (importing nothing) on purpose: DataTable
// needs only this pure function, and pulling it from tableRegistry — which
// reads the route column exports at module-init — would close an import cycle
// (tableRegistry → *Routes → DataTable → tableRegistry) that throws a
// "Cannot access uninitialized variable" TDZ error in the bundled prod build.
export function applyColumnVisibility<
  C extends { key: unknown; defaultHidden?: boolean },
>(columns: C[], visibleKeys: string[] | undefined): C[] {
  return visibleKeys
    ? columns.filter((col) => visibleKeys.includes(String(col.key)))
    : columns.filter((col) => !col.defaultHidden);
}
