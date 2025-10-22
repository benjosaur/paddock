import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { MagLogForm } from "../pages/MagLogForm";
import { trpc } from "../utils/trpc";
import { formatYmdToDmy } from "@/utils/date";
import type { ClientFull, MagLog, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const magLogColumns: TableColumn<MagLog>[] = [
  { key: "date", header: "Date", render: (item) => formatYmdToDmy(item.date) },
  {
    key: "total",
    header: "Total Attendees",
    render: (item: ClientFull["magLogs"][number]) =>
      item.details.totalVolunteers +
      item.details.totalClients +
      item.details.totalFamily +
      item.details.totalMps +
      item.details.otherAttendees,
  },
  {
    key: "notes",
    header: "Notes",
    render: (item) => item.details.notes,
  },
];

export default function MagLogRoutes() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const magQuery = useQuery(trpc.mag.getAll.queryOptions());

  const mag = magQuery.data || [];

  // Sort logs by date (newest first)
  const sortedMag = mag
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const deleteMagLogMutation = useMutation(
    trpc.mag.delete.mutationOptions({
      onSuccess: () => {
        associatedMagLogRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  const handleAddNew = () => {
    navigate("/mag/new");
  };

  const handleEdit = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/mag/edit/${encodedId}`);
  };

  const handleDelete = (id: string) => {
    deleteMagLogMutation.mutate({ id });
  };

  if (magQuery.isLoading) return <div>Loading...</div>;
  if (magQuery.error) return <div>Error loading MP </div>;

  return (
    <Routes>
      <Route
        index
        element={
          <DataTable
            key="mag-logs"
            title="MAG "
            searchPlaceholder="Search MAG logs..."
            data={sortedMag}
            columns={magLogColumns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreate={handleAddNew}
            resource="mag"
          />
        }
      />
      <Route path="new" element={<MagLogForm />} />
      <Route path="edit/:id" element={<MagLogForm />} />
    </Routes>
  );
}

export const associatedMagLogRoutes: any[] = [
  // MAG logs
  trpc.mag.getAll,
  trpc.mag.getById,
];
