import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { MagLogForm } from "../pages/MagLogForm";
import { mockMagLogs, mockClients } from "../data/mockData";
import type { MagLog, TableColumn } from "../types";

const magLogColumns: TableColumn<MagLog>[] = [
  { key: "id", header: "ID" },
  { key: "date", header: "Date" },
  { key: "total", header: "Total" },
  {
    key: "attendees",
    header: "Registered Attendees",
    render: (item) => {
      const clientNames = item.attendees.map((clientId) => {
        const client = mockClients.find((c) => c.id === clientId);
        return client ? client.name : clientId;
      });
      return clientNames.join(", ");
    },
  },
  { key: "notes", header: "Notes" },
];

interface MagLogRoutesProps {
  onDelete: (id: number) => void;
}

export default function MagLogRoutes({ onDelete }: MagLogRoutesProps) {
  const navigate = useNavigate();

  const handleAddNew = () => {
    navigate("/mag-logs/new");
  };

  const handleEdit = (id: number) => {
    navigate(`/mag-logs/edit/${id}`);
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
            onEdit={handleEdit}
            onDelete={onDelete}
            onAddNew={handleAddNew}
          />
        }
      />
      <Route path="new" element={<MagLogForm />} />
      <Route path="edit/:id" element={<MagLogForm />} />
    </Routes>
  );
}
