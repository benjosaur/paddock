import { configurableTableIds } from "shared/const";
import { TableColumn } from "../types";
import { clientColumns } from "../routes/ClientsRoutes";
import { mpColumns } from "../routes/MpsRoutes";
import { volunteerColumns } from "../routes/VolunteersRoutes";
import { requestColumns } from "../routes/RequestRoutes";
import { packageColumns } from "../routes/PackageRoutes";

export type ConfigurableTableId = (typeof configurableTableIds)[number];

// The column-visibility rule shared by DataTable rendering and the copilot
// catalog (which must agree on what is on screen): an explicit config list
// wins, otherwise all non-defaultHidden columns are shown.
export function applyColumnVisibility<
  C extends { key: unknown; defaultHidden?: boolean },
>(columns: C[], visibleKeys: string[] | undefined): C[] {
  return visibleKeys
    ? columns.filter((col) => visibleKeys.includes(String(col.key)))
    : columns.filter((col) => !col.defaultHidden);
}

function columnMeta<T>(columns: TableColumn<T>[]) {
  return columns.map((col) => ({
    key: String(col.key),
    header: col.header,
    defaultHidden: col.defaultHidden ?? false,
  }));
}

// Tables whose column visibility is admin-configurable (Settings → Table
// Columns). Keys must match the tableId passed to that page's DataTable.
export const tableRegistry: Record<
  ConfigurableTableId,
  {
    label: string;
    columns: { key: string; header: string; defaultHidden: boolean }[];
  }
> = {
  clients: { label: "Clients", columns: columnMeta(clientColumns) },
  mps: { label: "MPs", columns: columnMeta(mpColumns) },
  volunteers: { label: "Volunteers", columns: columnMeta(volunteerColumns) },
  requests: { label: "Care Requests", columns: columnMeta(requestColumns) },
  packages: { label: "Care Confirmed", columns: columnMeta(packageColumns) },
};
