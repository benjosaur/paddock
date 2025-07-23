import { Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { trpc } from "../utils/trpc";
import type { TrainingRecord, TableColumn } from "../types";
import { useQuery } from "@tanstack/react-query";
import { calculateTimeToDate } from "@/utils/helpers";

const recordColumns: TableColumn<TrainingRecord>[] = [
  {
    key: "personName",
    header: "Name",
    render: (item) => item.details.name,
  },
  {
    key: "personType",
    header: "Role",
    render: (item) => (item.ownerId.startsWith("m") ? "mp" : "volunteer"),
  },
  {
    key: "recordName",
    header: "Training Record",
    render: (item) => item.details.recordName,
  },
  {
    key: "date",
    header: "Expires",
    render: (item) => calculateTimeToDate(item.expiryDate),
  },
];

export default function RecordsRoutes() {
  const recordsQuery = useQuery(trpc.trainingRecords.getAll.queryOptions());

  const records = recordsQuery.data || [];

  if (recordsQuery.isLoading) return <div>Loading...</div>;
  if (recordsQuery.error) return <div>Error loading records</div>;

  return (
    <Routes>
      <Route
        index
        element={
          <DataTable
            key="records"
            title="Training Records"
            searchPlaceholder="Search records..."
            data={records}
            columns={recordColumns}
            resource="trainingRecords"
          />
        }
      />
    </Routes>
  );
}
