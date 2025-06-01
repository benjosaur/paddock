import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { MpLogForm } from "../components/MpLogForm";
import { mockMpLogs, mockClients, mockMps } from "../data/mockData";
import type { MpLog, TableColumn, Client, Mp } from "../types";

const mpLogColumns: TableColumn<MpLog>[] = [
  { key: "id", header: "ID" },
  { key: "date", header: "Date" },
  {
    key: "clientId",
    header: "Client",
    render: (item: MpLog) =>
      mockClients.find((c: Client) => c.id === item.clientId)?.name ||
      item.clientId,
  },
  {
    key: "mpId",
    header: "MP",
    render: (item: MpLog) =>
      mockMps.find((mp: Mp) => mp.id === item.mpId)?.name || item.mpId,
  },
  {
    key: "services",
    header: "Service(s)",
    render: (item: MpLog) => item.services.join(", "),
  },
  { key: "hoursLogged", header: "Hours Logged" },
  { key: "notes", header: "Notes" },
];

interface MpLogRoutesProps {
  onDelete: (id: string) => void;
}

export default function MpLogRoutes({ onDelete }: MpLogRoutesProps) {
  const navigate = useNavigate();

  const handleAddNew = () => {
    navigate("/mp-logs/create");
  };

  const handleEdit = (id: string) => {
    navigate(`/mp-logs/edit/${id}`);
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
            data={mockMpLogs}
            columns={mpLogColumns}
            onEdit={handleEdit}
            onDelete={onDelete}
            onAddNew={handleAddNew}
          />
        }
      />
      <Route path="create" element={<MpLogForm />} />
      <Route path="edit/:id" element={<MpLogForm />} />
    </Routes>
  );
}
