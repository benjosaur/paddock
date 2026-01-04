import { Package, RequestFull, TableColumn } from "@/types";
import { formatYmdToDmy } from "@/utils/date";
import { DataTable } from "./DataTable";

interface CarerPackageSummary {
  id: string;
  clientName: string;
  carerName: string;
  requestedWeeklyHours: number;
  requestedOneOffHours: number;
  weeklyHours: number;
  oneOffHours: number;
  startDate: string;
  endDate: string;
  services: Package["details"]["services"];
}

const carerPackageColumns: TableColumn<CarerPackageSummary>[] = [
  {
    key: "clientName",
    header: "Client Name",
    render: (item) => item.clientName,
  },
  {
    key: "carerName",
    header: "Carer Name",
    render: (item) => item.carerName,
  },
  {
    key: "startDate",
    header: "Start Date",
    render: (item) => formatYmdToDmy(item.startDate),
  },
  {
    key: "endDate",
    header: "End Date",
    render: (item) =>
      item.endDate === "open" ? "Ongoing" : formatYmdToDmy(item.endDate),
  },
  {
    key: "requestedWeeklyHours",
    header: "Requested Weekly Hours",
    render: (item) => item.requestedWeeklyHours,
  },
  {
    key: "requestedOneOffHours",
    header: "Requested One-Off Hours",
    render: (item) => item.requestedOneOffHours,
  },
  {
    key: "weeklyHours",
    header: "Weekly Hours",
    render: (item) => item.weeklyHours,
  },
  {
    key: "oneOffHours",
    header: "One-Off Hours",
    render: (item) => item.oneOffHours,
  },
  {
    key: "services",
    header: "Services",
    render: (item) => item.services.join(", "),
  },
];

interface CarerPackagesTableProps {
  carerId: string;
  requests: RequestFull[];
}

export function CarerPackagesTable({
  carerId,
  requests,
}: CarerPackagesTableProps) {
  const rows: CarerPackageSummary[] = requests.flatMap((req) =>
    req.packages
      .filter((pkg) => pkg.carerId === carerId)
      .map((pkg) => ({
        id: pkg.id,
        clientName: req.details.name,
        carerName: pkg.details.name,
        requestedWeeklyHours: req.details.weeklyHours,
        requestedOneOffHours: req.details.oneOffStartDateHours,
        weeklyHours: pkg.details.weeklyHours,
        oneOffHours: pkg.details.oneOffStartDateHours,
        startDate: pkg.startDate,
        endDate: pkg.endDate,
        services: pkg.details.services,
      }))
  );
  return (
    <DataTable
      data={rows}
      columns={carerPackageColumns}
      title=""
      searchPlaceholder="Search packages..."
      resource="packages"
    />
  );
}
