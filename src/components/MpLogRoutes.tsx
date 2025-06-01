import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "./DataTable";
import { MpLogForm } from "./MpLogForm";
import { mockMpLogs } from "../data/mockData";
import type { MpLog, TableColumn } from "../types";

const mpLogColumns: TableColumn<MpLog>[] = [
  { key: "id", header: "ID" },
  { key: "date", header: "Date" },
  { key: "client", header: "Client" },
  { key: "mp", header: "MP" },
  {
    key: "services",
    header: "Service(s)",
    render: (item: MpLog) => item.services.join(", "),
  },
  { key: "hoursLogged", header: "Hours Logged" },
  { key: "notes", header: "Notes" },
];

interface MpLogRoutesProps {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function MpLogRoutes({ onEdit, onDelete }: MpLogRoutesProps) {
  const navigate = useNavigate();

  const handleAddNew = () => {
    navigate("/mp-logs/create");
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
            onEdit={onEdit}
            onDelete={onDelete}
            onAddNew={handleAddNew}
          />
        }
      />
      <Route path="create" element={<MpLogForm />} />
    </Routes>
  );
}
