import { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Button } from "../components/ui/button";
import { VolunteerForm } from "../pages/VolunteerForm";
import { VolunteerDetailModal } from "../components/VolunteerDetailModal";
import { trpc } from "../utils/trpc";
import type { VolunteerMetadata, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const volunteerColumns: TableColumn<VolunteerMetadata>[] = [
  {
    key: "name",
    header: "Name",
    render: (item: VolunteerMetadata) => item.details.name,
  },
  {
    key: "currentRole",
    header: "Role",
    render: (item: VolunteerMetadata) => item.details.currentRole,
  },
  {
    key: "dob",
    header: "Date of Birth",
    render: (item: VolunteerMetadata) => item.dateOfBirth || "Unknown",
  },
  {
    key: "postCode",
    header: "Post Code",
    render: (item: VolunteerMetadata) => item.details.address.postCode,
  },
  {
    key: "services",
    header: "Services",
    render: (item: VolunteerMetadata) => item.details.services.join(", "),
  },
  {
    key: "dbsExpiry",
    header: "DBS Expiry",
    render: (item: VolunteerMetadata) => item.dbsExpiry || "No DBS",
  },
  {
    key: "capacity",
    header: "Capacity?",
    render: (item: VolunteerMetadata) => item.details.capacity,
  },
];

export function VolunteersRoutes() {
  const navigate = useNavigate();
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string | null>(
    null
  );
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const queryClient = useQueryClient();

  const volunteersQuery = useQuery(
    showArchived
      ? trpc.volunteers.getAll.queryOptions()
      : trpc.volunteers.getAllNotArchived.queryOptions()
  );
  const volunteersQueryKey = showArchived
    ? trpc.volunteers.getAll.queryKey()
    : trpc.volunteers.getAllNotArchived.queryKey();

  const archiveVolunteerMutation = useMutation(
    trpc.volunteers.toggleArchive.mutationOptions({
      onSuccess: () => {
        associatedVolunteerRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

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

  const handleArchiveToggle = (id: string) => {
    archiveVolunteerMutation.mutate({ id });
  };

  const handleEditNavigation = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/volunteers/edit/${encodedId}`);
  };

  const handleViewVolunteer = (id: string) => {
    setSelectedVolunteerId(id);
    setIsVolunteerModalOpen(true);
  };

  const handleCloseVolunteerModal = () => {
    setIsVolunteerModalOpen(false);
    setSelectedVolunteerId(null);
  };

  const handleDelete = (id: string) => {
    deleteVolunteerMutation.mutate({ id });
  };

  const handleAddRecord = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/records/create?ownerId=${encodedId}&ownerType=volunteer`);
  };

  if (volunteersQuery.isLoading) return <div>Loading...</div>;
  if (volunteersQuery.error) return <div>Error loading Volunteers</div>;

  return (
    <Routes>
      <Route
        index
        element={
          <>
            <DataTable
              key={`volunteers-${showArchived}`}
              title="Volunteers"
              searchPlaceholder="Search volunteers..."
              data={volunteersQuery.data || []}
              columns={volunteerColumns}
              onArchive={handleArchiveToggle}
              onEdit={handleEditNavigation}
              onDelete={handleDelete}
              onAddRecord={handleAddRecord}
              onViewItem={handleViewVolunteer as (item: unknown) => void}
              onCreate={handleAddNew}
              resource="volunteers"
              customActions={
                <Button
                  variant={showArchived ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                  className="shadow-sm"
                >
                  {showArchived ? "Hide Archived" : "Show Archived"}
                </Button>
              }
            />
            {selectedVolunteerId && (
              <VolunteerDetailModal
                volunteerId={selectedVolunteerId}
                isOpen={isVolunteerModalOpen}
                onClose={handleCloseVolunteerModal}
                onEdit={handleEditNavigation}
                onDelete={handleDelete}
              />
            )}
          </>
        }
      />
      <Route path="create" element={<VolunteerForm />} />
      <Route path="edit/:id" element={<VolunteerForm />} />
    </Routes>
  );
}

export default VolunteersRoutes;

export const associatedVolunteerRoutes: any[] = [
  // Volunteers
  trpc.volunteers.getAll,
  trpc.volunteers.getAllNotArchived,
  trpc.volunteers.getById,

  // MAG
  trpc.mag.getAll,
  trpc.mag.getById,

  // Packages
  trpc.packages.getAll,
  trpc.packages.getAllNotArchived,
  trpc.packages.getAllNotEndedYet,
  trpc.packages.getById,

  // Requests
  trpc.requests.getAll,
  trpc.requests.getAllNotArchived,
  trpc.requests.getAllNotEndedYet,
  trpc.requests.getById,
  trpc.requests.getAllMetadata,

  // Training records
  trpc.trainingRecords.getAll,
  trpc.trainingRecords.getAllNotArchived,
  trpc.trainingRecords.getById,
  trpc.trainingRecords.getByExpiringBefore,
];
