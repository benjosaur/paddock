import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { MagLogForm } from "../components/MagLogForm";
import { mockMagLogs } from "../data/mockData";
import type { MagLog, TableColumn } from "../types";

const magLogColumns: TableColumn<MagLog>[] = [
  { key: "id", header: "ID" },
  { key: "date", header: "Date" },
  { key: "total", header: "Total" },
  {
    key: "attendees",
    header: "Registered Attendees",
    render: (item) => item.attendees.join(", "),
  },
  { key: "notes", header: "Notes" },
];

interface MagLogRoutesProps {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function MagLogRoutes({ onEdit, onDelete }: MagLogRoutesProps) {
  const navigate = useNavigate();

  const handleAddNew = () => {
    navigate("/mag-logs/new");
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
            data={mockMagLogs}
            columns={magLogColumns}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddNew={handleAddNew}
          />
        }
      />
      <Route path="new" element={<MagLogForm />} />
    </Routes>
  );
}
