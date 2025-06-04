import { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { VolunteerForm } from "../pages/VolunteerForm";
import { VolunteerDetailModal } from "../components/VolunteerDetailModal";
import { trpc } from "../utils/trpc";
import type { Volunteer, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calculateAgeBracket } from "@/utils/helpers";

const volunteerColumns: TableColumn<Volunteer>[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  {
    key: "dob",
    header: "Age",
    render: (item: Volunteer) =>
      item.dob ? calculateAgeBracket(item.dob) + " years" : "Unknown",
  },
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

export default function VolunteersRoutes() {
  const navigate = useNavigate();
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(
    null
  );
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const volunteersQuery = useQuery(trpc.volunteers.getAll.queryOptions());
  const volunteersQueryKey = trpc.volunteers.getAll.queryKey();

  const volunteers = volunteersQuery.data || [];

  const deleteVolunteerMutation = useMutation(
    trpc.volunteers.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: volunteersQueryKey });
      },
    })
  );

  const handleAddNew = () => {
    navigate("/volunteers/create");
  };

  const handleEditNavigation = (id: number) => {
    navigate(`/volunteers/edit/${id}`);
  };

  const handleViewVolunteer = (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
    setIsVolunteerModalOpen(true);
  };

  const handleCloseVolunteerModal = () => {
    setIsVolunteerModalOpen(false);
    setSelectedVolunteer(null);
  };

  const handleDelete = (id: number) => {
    deleteVolunteerMutation.mutate({ id });
  };

  return (
    <Routes>
      <Route
        index
        element={
          <>
            <DataTable
              key="volunteers"
              title="Volunteers"
              searchPlaceholder="Search volunteers..."
              data={volunteers}
              columns={volunteerColumns}
              onEdit={handleEditNavigation}
              onDelete={handleDelete}
              onViewItem={handleViewVolunteer as (item: unknown) => void}
              onAddNew={handleAddNew}
            />
            <VolunteerDetailModal
              volunteer={selectedVolunteer}
              isOpen={isVolunteerModalOpen}
              onClose={handleCloseVolunteerModal}
            />
          </>
        }
      />
      <Route path="create" element={<VolunteerForm />} />
      <Route path="edit/:id" element={<VolunteerForm />} />
    </Routes>
  );
}
