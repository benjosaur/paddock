import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { VolunteerForm } from "../components/VolunteerForm";
import { mockVolunteers } from "../data/mockData";
import type { Volunteer, TableColumn } from "../types";

const volunteerColumns: TableColumn<Volunteer>[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "age", header: "Age" },
  { key: "postCode", header: "Post Code" },
  {
    key: "servicesOffered",
    header: "Services",
    render: (item: Volunteer) => item.servicesOffered.join(", "),
  },
  {
    key: "needTypes",
    header: "Need Types",
    render: (item: Volunteer) => item.needTypes.join(", "),
  },
  { key: "dbsExpiry", header: "DBS" },
  { key: "capacity", header: "Capacity?" },
  { key: "transport", header: "Transport?" },
];

export default function VolunteersRoutes({
  handleDelete,
  handleViewVolunteer,
}: {
  handleDelete: (id: string) => void;
  handleViewVolunteer: (volunteer: Volunteer) => void;
}) {
  const navigate = useNavigate();

  const handleAddNew = () => {
    navigate("/volunteers/create");
  };

  const handleEditNavigation = (id: string) => {
    navigate(`/volunteers/edit/${id}`);
  };

  return (
    <Routes>
      <Route
        index
        element={
          <DataTable
            key="volunteers"
            title="Volunteers"
            searchPlaceholder="Search volunteers..."
            data={mockVolunteers}
            columns={volunteerColumns}
            onEdit={handleEditNavigation}
            onDelete={handleDelete}
            onViewItem={handleViewVolunteer as (item: unknown) => void}
            onAddNew={handleAddNew}
          />
        }
      />
      <Route path="create" element={<VolunteerForm />} />
      <Route path="edit/:id" element={<VolunteerForm />} />
    </Routes>
  );
}
