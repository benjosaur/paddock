import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { VolunteerLogForm } from "../pages/VolunteerLogForm";
import { trpc } from "../utils/trpc";
import type { VolunteerLog, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const volunteerLogColumns: TableColumn<VolunteerLog>[] = [
  { key: "id", header: "ID" },
  { key: "date", header: "Date" },
  {
    key: "clients",
    header: "Clients",
    render: (item: VolunteerLog) =>
      item.clients.map((client) => client.details.name).join(", "),
  },
  {
    key: "volunteers",
    header: "Volunteers",
    render: (item: VolunteerLog) =>
      item.volunteers.map((volunteer) => volunteer.details.name).join(", "),
  },
  {
    key: "services",
    header: "Service(s)",
    render: (item: VolunteerLog) => item.details.services.join(", "),
  },
  {
    key: "hoursLogged",
    header: "Hours Logged",
    render: (item: VolunteerLog) => item.details.hoursLogged,
  },
  {
    key: "notes",
    header: "Notes",
    render: (item: VolunteerLog) => item.details.hoursLogged,
  },
];

export default function VolunteerLogRoutes() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const volunteerLogsQuery = useQuery(trpc.volunteerLogs.getAll.queryOptions());

  const volunteerLogsQueryKey = trpc.volunteerLogs.getAll.queryKey();

  const volunteerLogs = volunteerLogsQuery.data || [];

  const deleteVolunteerLogMutation = useMutation(
    trpc.volunteerLogs.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: volunteerLogsQueryKey });
      },
    })
  );

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

  if (volunteerLogsQuery.isLoading) return <div>Loading...</div>;
  if (volunteerLogsQuery.error) return <div>Error loading Volunteer Logs</div>;

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
