import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { VolunteerLogForm } from "../pages/VolunteerLogForm";
import {
  mockVolunteerLogs,
  mockClients,
  mockVolunteers,
} from "../data/mockData";
import type { VolunteerLog, TableColumn, Client, Volunteer } from "../types";

const volunteerLogColumns: TableColumn<VolunteerLog>[] = [
  { key: "id", header: "ID" },
  { key: "date", header: "Date" },
  {
    key: "clientId",
    header: "Client",
    render: (item: VolunteerLog) =>
      mockClients.find((c: Client) => c.id === item.clientId)?.name ||
      item.clientId,
  },
  {
    key: "volunteerId",
    header: "Volunteer",
    render: (item: VolunteerLog) =>
      mockVolunteers.find((v: Volunteer) => v.id === item.volunteerId)?.name ||
      item.volunteerId,
  },
  { key: "activity", header: "Activity" },
  { key: "hoursLogged", header: "Hours Logged" },
  { key: "notes", header: "Notes" },
];

interface VolunteerLogRoutesProps {
  onDelete: (id: number) => void;
}

export default function VolunteerLogRoutes({
  onDelete,
}: VolunteerLogRoutesProps) {
  const navigate = useNavigate();

  const handleAddNew = () => {
    navigate("/volunteer-logs/create");
  };

  const handleEdit = (id: number) => {
    navigate(`/volunteer-logs/edit/${id}`);
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
            onEdit={handleEdit}
            onDelete={onDelete}
            onAddNew={handleAddNew}
          />
        }
      />
      <Route path="create" element={<VolunteerLogForm />} />
      <Route path="edit/:id" element={<VolunteerLogForm />} />
    </Routes>
  );
}
