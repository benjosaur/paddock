import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "./DataTable";
import { VolunteerForm } from "./VolunteerForm";
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

export function VolunteersRoutes({
  handleEdit,
  handleDelete,
  handleViewVolunteer,
}: {
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  handleViewVolunteer: (volunteer: Volunteer) => void;
}) {
  const navigate = useNavigate();

  const handleAddNew = () => {
    navigate("/volunteers/create");
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
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewItem={handleViewVolunteer as (item: unknown) => void}
            onAddNew={handleAddNew}
          />
        }
      />
      <Route path="create" element={<VolunteerForm />} />
    </Routes>
  );
}
