import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { MagLogForm } from "../pages/MagLogForm";
import { trpc } from "../utils/trpc";
import type { ClientFull, MagLog, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const magLogColumns: TableColumn<MagLog>[] = [
  { key: "id", header: "ID", render: (item) => item.id },
  { key: "date", header: "Date", render: (item) => item.date },
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
    key: "attendees",
    header: "Registered Attendees",
    render: (item) =>
      item.clients.map((client) => client.details.name).join(", "),
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

  const magQueryKey = trpc.mag.getAll.queryKey();

  const mag = magQuery.data || [];

  const deleteMagLogMutation = useMutation(
    trpc.mag.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: magQueryKey });
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
            data={mag}
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
