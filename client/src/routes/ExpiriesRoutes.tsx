import { Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { trpc } from "../utils/trpc";
import type { ExpiryItem, TableColumn } from "../types";
import { useQuery } from "@tanstack/react-query";
import { calculateTimeToDate } from "@/utils/helpers";

const expiryColumns: TableColumn<ExpiryItem>[] = [
  {
    key: "personName",
    header: "Name",
    render: (item: ExpiryItem) => item.person.name,
  },
  {
    key: "personType",
    header: "Role",
    render: (item: ExpiryItem) => item.person.type,
  },
  { key: "name", header: "Item" },
  {
    key: "date",
    header: "Expires",
    render: (item: ExpiryItem) => calculateTimeToDate(item.date),
  },
  {
    key: "type",
    header: "Category",
    render: (item: ExpiryItem) => (item.type === "dbs" ? "DBS" : "Training"),
  },
];

export default function ExpiriesRoutes() {
  const expiriesQuery = useQuery(trpc.expiries.getAll.queryOptions());

  const expiries = expiriesQuery.data || [];

  if (expiriesQuery.isLoading) return <div>Loading...</div>;
  if (expiriesQuery.error) return <div>Error loading expiries</div>;

  return (
    <Routes>
      <Route
        index
        element={
          <DataTable
            key="expiries"
            title="DBS and Training Expiries"
            searchPlaceholder="Search expiries..."
            data={expiries}
            columns={expiryColumns}
          />
        }
      />
    </Routes>
  );
}
