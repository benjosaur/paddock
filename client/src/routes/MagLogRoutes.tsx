import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { MagLogForm } from "../pages/MagLogForm";
import { trpc } from "../utils/trpc";
import type { MagLog, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function MagLogRoutes() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const magLogsQuery = useQuery(trpc.magLogs.getAll.queryOptions());
  const clientsQuery = useQuery(trpc.clients.getAll.queryOptions());
  const magLogsQueryKey = trpc.magLogs.getAll.queryKey();

  const magLogs = magLogsQuery.data || [];
  const clients = clientsQuery.data || [];

  const deleteMagLogMutation = useMutation(
    trpc.magLogs.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: magLogsQueryKey });
      },
    })
  );

  // Update columns to use tRPC data
  const magLogColumns: TableColumn<MagLog>[] = [
    { key: "id", header: "ID" },
    { key: "date", header: "Date" },
    { key: "total", header: "Total" },
    {
      key: "attendees",
      header: "Registered Attendees",
      render: (item) => {
        const clientNames = item.attendees.map((clientId) => {
          const client = clients.find(
            (c: { id: number; name: string }) => c.id === clientId
          );
          return client ? client.name : clientId;
        });
        return clientNames.join(", ");
      },
    },
    { key: "notes", header: "Notes" },
  ];

  const handleAddNew = () => {
    navigate("/mag-logs/new");
  };

  const handleEdit = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/mag-logs/edit/${encodedId}`);
  };

  const handleDelete = (id: string) => {
    deleteMagLogMutation.mutate({ id });
  };

  return (
    <Routes>
      <Route
        index
        element={
          <DataTable
            key="mag-logs"
            title="MAG Logs"
            searchPlaceholder="Search MAG logs..."
            data={magLogs}
            columns={magLogColumns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddNew={handleAddNew}
            resource="magLogs"
          />
        }
      />
      <Route path="new" element={<MagLogForm />} />
      <Route path="edit/:id" element={<MagLogForm />} />
    </Routes>
  );
}
