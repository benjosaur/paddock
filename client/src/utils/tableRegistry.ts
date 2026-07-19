import { configurableTableIds } from "shared/const";
import { TableColumn } from "../types";
import { clientColumns } from "../routes/ClientsRoutes";
import { mpColumns } from "../routes/MpsRoutes";
import { volunteerColumns } from "../routes/VolunteersRoutes";
import { requestColumns } from "../routes/RequestRoutes";
import { packageColumns } from "../routes/PackageRoutes";

export type ConfigurableTableId = (typeof configurableTableIds)[number];

function columnMeta<T>(columns: TableColumn<T>[]) {
  return columns.map((col) => ({ key: String(col.key), header: col.header }));
}

// Tables whose column visibility is admin-configurable (Settings → Table
// Columns). Keys must match the tableId passed to that page's DataTable.
export const tableRegistry: Record<
  ConfigurableTableId,
  { label: string; columns: { key: string; header: string }[] }
> = {
  clients: { label: "Clients", columns: columnMeta(clientColumns) },
  mps: { label: "MPs", columns: columnMeta(mpColumns) },
  volunteers: { label: "Volunteers", columns: columnMeta(volunteerColumns) },
  requests: { label: "Care Requests", columns: columnMeta(requestColumns) },
  packages: { label: "Care Confirmed", columns: columnMeta(packageColumns) },
};
