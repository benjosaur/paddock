import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { VolunteerLogForm } from "../pages/VolunteerLogForm";
import { trpc } from "../utils/trpc";
import type { VolunteerLog, TableColumn, Client, Volunteer } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function VolunteerLogRoutes() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const volunteerLogsQuery = useQuery(trpc.volunteerLogs.getAll.queryOptions());
  const clientsQuery = useQuery(trpc.clients.getAll.queryOptions());
  const volunteersQuery = useQuery(trpc.volunteers.getAll.queryOptions());
  const volunteerLogsQueryKey = trpc.volunteerLogs.getAll.queryKey();

  const volunteerLogs = volunteerLogsQuery.data || [];
  const clients = clientsQuery.data || [];
  const volunteers = volunteersQuery.data || [];

  const deleteVolunteerLogMutation = useMutation(
    trpc.volunteerLogs.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: volunteerLogsQueryKey });
      },
    })
  );

  // Update columns to use tRPC data
  const volunteerLogColumns: TableColumn<VolunteerLog>[] = [
    { key: "id", header: "ID" },
    { key: "date", header: "Date" },
    {
      key: "clientId",
      header: "Client",
      render: (item: VolunteerLog) =>
        clients.find((c: Client) => c.id === item.clientId)?.name ||
        item.clientId,
    },
    {
      key: "volunteerId",
      header: "Volunteer",
      render: (item: VolunteerLog) =>
        volunteers.find((v: Volunteer) => v.id === item.volunteerId)?.name ||
        item.volunteerId,
    },
    { key: "activity", header: "Activity" },
    { key: "hoursLogged", header: "Hours Logged" },
    { key: "notes", header: "Notes" },
  ];

  const handleAddNew = () => {
    navigate("/volunteer-logs/create");
  };

  const handleEdit = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/volunteer-logs/edit/${encodedId}`);
  };

  const handleDelete = (id: string) => {
    deleteVolunteerLogMutation.mutate({ id });
  };

  return (
    <Routes>
      <Route
        index
        element={
          <DataTable
            key="volunteer-logs"
            title="Volunteer Logs"
            searchPlaceholder="Search volunteer logs..."
            data={volunteerLogs}
            columns={volunteerLogColumns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddNew={handleAddNew}
            resource="volunteerLogs"
          />
        }
      />
      <Route path="create" element={<VolunteerLogForm />} />
      <Route path="edit/:id" element={<VolunteerLogForm />} />
    </Routes>
  );
}
