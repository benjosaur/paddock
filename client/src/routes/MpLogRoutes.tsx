import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { MpLogForm } from "../pages/MpLogForm";
import { trpc } from "../utils/trpc";
import type { MpLog, TableColumn, Client, Mp } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function MpLogRoutes() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const mpLogsQuery = useQuery(trpc.mpLogs.getAll.queryOptions());
  const clientsQuery = useQuery(trpc.clients.getAll.queryOptions());
  const mpsQuery = useQuery(trpc.mps.getAll.queryOptions());
  const mpLogsQueryKey = trpc.mpLogs.getAll.queryKey();

  const mpLogs = mpLogsQuery.data || [];
  const clients = clientsQuery.data || [];
  const mps = mpsQuery.data || [];

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

  const handleEdit = (id: number) => {
    navigate(`/mp-logs/edit/${id}`);
  };

  const handleDelete = (id: number) => {
    deleteMpLogMutation.mutate({ id });
  };

  // Update columns to use tRPC data
  const mpLogColumns: TableColumn<MpLog>[] = [
    { key: "id", header: "ID" },
    { key: "date", header: "Date" },
    {
      key: "clientId",
      header: "Client",
      render: (item: MpLog) =>
        clients.find((c: Client) => c.id === item.clientId)?.name ||
        item.clientId,
    },
    {
      key: "mpId",
      header: "MP",
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
          />
        }
      />
      <Route path="create" element={<MpLogForm />} />
      <Route path="edit/:id" element={<MpLogForm />} />
    </Routes>
  );
}
