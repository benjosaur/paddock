import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { MpLogForm } from "../pages/MpLogForm";
import { trpc } from "../utils/trpc";
import type { MpLog, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const mpLogColumns: TableColumn<MpLog>[] = [
  { key: "id", header: "ID" },
  { key: "date", header: "Date" },
  {
    key: "clients",
    header: "Clients",
    render: (item: MpLog) =>
      item.clients.map((client) => client.details.name).join(", "),
  },
  {
    key: "mps",
    header: "MPs",
    render: (item: MpLog) =>
      mps.find((mp: Mp) => mp.id === item.mpId)?.name || item.mpId,
  },
  {
    key: "services",
    header: "Service(s)",
    render: (item: MpLog) => item.services.join(", "),
  },
  { key: "hoursLogged", header: "Hours Logged" },
  { key: "notes", header: "Notes" },
];

export default function MpLogRoutes() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const mpLogsQuery = useQuery(trpc.mpLogs.getAll.queryOptions());

  const mpLogsQueryKey = trpc.mpLogs.getAll.queryKey();

  const mpLogs = mpLogsQuery.data || [];

  const deleteMpLogMutation = useMutation(
    trpc.mpLogs.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mpLogsQueryKey });
      },
    })
  );

  const handleAddNew = () => {
    navigate("/mp-logs/create");
  };

  const handleEdit = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/mp-logs/edit/${encodedId}`);
  };

  const handleDelete = (id: string) => {
    deleteMpLogMutation.mutate({ id });
  };

  return (
    <Routes>
      <Route
        index
        element={
          <DataTable
            key="mp-logs"
            title="MP Logs"
            searchPlaceholder="Search MP logs..."
            data={mpLogs}
            columns={mpLogColumns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddNew={handleAddNew}
            resource="mpLogs"
          />
        }
      />
      <Route path="create" element={<MpLogForm />} />
      <Route path="edit/:id" element={<MpLogForm />} />
    </Routes>
  );
}
