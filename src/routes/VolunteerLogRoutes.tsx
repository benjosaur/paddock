import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { VolunteerLogForm } from "../components/VolunteerLogForm";
import { mockVolunteerLogs } from "../data/mockData";
import type { VolunteerLog, TableColumn } from "../types";

const volunteerLogColumns: TableColumn<VolunteerLog>[] = [
  { key: "id", header: "ID" },
  { key: "date", header: "Date" },
  { key: "volunteer", header: "Volunteer" },
  { key: "activity", header: "Activity" },
  { key: "hoursLogged", header: "Hours Logged" },
  { key: "notes", header: "Notes" },
];

interface VolunteerLogRoutesProps {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function VolunteerLogRoutes({
  onEdit,
  onDelete,
}: VolunteerLogRoutesProps) {
  const navigate = useNavigate();

  const handleAddNew = () => {
    navigate("/volunteer-logs/create");
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
            data={mockVolunteerLogs}
            columns={volunteerLogColumns}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddNew={handleAddNew}
          />
        }
      />
      <Route path="create" element={<VolunteerLogForm />} />
    </Routes>
  );
}
