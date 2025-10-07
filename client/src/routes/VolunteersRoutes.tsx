import { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Button } from "../components/ui/button";
import { VolunteerForm } from "../pages/VolunteerForm";
import { VolunteerDetailModal } from "../components/VolunteerDetailModal";
import { trpc } from "../utils/trpc";
import type { VolunteerMetadata, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EndPersonDetails } from "shared";
import EndDialog from "../components/EndDialog";

const volunteerColumns: TableColumn<VolunteerMetadata>[] = [
  {
    key: "name",
    header: "Name",
    render: (item: VolunteerMetadata) => item.details.name,
  },
  {
    key: "role",
    header: "Role",
    render: (item: VolunteerMetadata) => item.details.role,
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
  const [showEnded, setShowEnded] = useState(false);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [endDetails, setEndDetails] = useState<EndPersonDetails | null>(null);

  const queryClient = useQueryClient();

  const volunteersQuery = useQuery(
    showEnded
      ? trpc.volunteers.getAll.queryOptions()
      : trpc.volunteers.getAllNotEnded.queryOptions()
  );
  const volunteersQueryKey = showEnded
    ? trpc.volunteers.getAll.queryKey()
    : trpc.volunteers.getAllNotEnded.queryKey();

  const deleteVolunteerMutation = useMutation(
    trpc.volunteers.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: volunteersQueryKey });
      },
    })
  );

  const updateVolunteerMutation = useMutation(
    trpc.volunteers.update.mutationOptions({
      onSuccess: () => {
        associatedVolunteerRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  const endVolunteerMutation = useMutation(
    trpc.volunteers.end.mutationOptions({
      onSuccess: () => {
        associatedVolunteerRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  const handleAddNew = () => {
    navigate("/volunteers/create");
  };

  const handleEditNavigation = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/volunteers/edit/${encodedId}`);
  };

  const handleAddSolePackage = (volunteerId: string) => {
    const encodedVolunteerId = encodeURIComponent(volunteerId);
    navigate(`/packages/sole/create?volunteerId=${encodedVolunteerId}`);
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

  const handleEnd = (vol: VolunteerMetadata) => {
    if (vol.endDate !== "open") {
      setEndDetails({ personId: vol.id, endDate: "" });
      setIsEndDialogOpen(true);
    } else {
      setEndDetails({ personId: vol.id, endDate: "open" });
      setIsEndDialogOpen(true);
    }
  };

  const handleConfirmEnd = () => {
    if (!endDetails?.personId || !endDetails.endDate) return;
    if (endDetails.endDate === "open") {
      const selected = volunteersQuery.data?.find(
        (v) => v.id === endDetails.personId
      );
      if (!selected) return;
      updateVolunteerMutation.mutate({
        ...selected,
        endDate: "open",
      } as unknown as any);
    } else {
      endVolunteerMutation.mutate(endDetails);
    }
    setIsEndDialogOpen(false);
    setEndDetails(null);
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
              key={`volunteers-${showEnded}`}
              title="Volunteers"
              searchPlaceholder="Search volunteers..."
              data={volunteersQuery.data || []}
              columns={volunteerColumns}
              onAddPackage={handleAddSolePackage}
              onEdit={handleEditNavigation}
              onDelete={handleDelete}
              onAddRecord={handleAddRecord}
              onEnd={handleEnd}
              onViewItem={handleViewVolunteer}
              onCreate={handleAddNew}
              resource="volunteers"
              customActions={
                <Button
                  variant={showEnded ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowEnded(!showEnded)}
                  className="shadow-sm"
                >
                  {showEnded ? "Hide Ended" : "Show Ended"}
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
            <EndDialog
              isOpen={isEndDialogOpen}
              onOpenChange={(open) => {
                setIsEndDialogOpen(open);
                if (!open) setEndDetails(null);
              }}
              entityLabel="Volunteer"
              endDate={endDetails?.endDate}
              onEndDateChange={(date) =>
                setEndDetails((prev) =>
                  prev ? { ...prev, endDate: date } : prev
                )
              }
              onConfirm={handleConfirmEnd}
              confirmDisabled={
                (endDetails?.endDate !== "open" && !endDetails?.endDate) ||
                !endDetails?.personId ||
                endVolunteerMutation.isPending
              }
              endDescription="Select an end date. This will also archive the volunteer."
              undoDescription="This will undo ending the volunteer. Associated packages will not be affected."
            />
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
  trpc.volunteers.getAllNotEnded,
  trpc.volunteers.getById,

  // MAG
  trpc.mag.getAll,
  trpc.mag.getById,

  // Packages
  trpc.packages.getAll,
  trpc.packages.getAllInfo,
  trpc.packages.getAllWithoutInfo,
  trpc.packages.getAllWithoutInfoNotEndedYet,
  trpc.packages.getById,

  // Requests
  trpc.requests.getAllWithoutInfoWithPackages,
  trpc.requests.getAllInfoMetadata,
  trpc.requests.getAllMetadataWithoutInfo,
  trpc.requests.getAllWithoutInfoNotEndedYetWithPackages,
  trpc.requests.getById,

  // Training records
  trpc.trainingRecords.getAll,
  trpc.trainingRecords.getAllNotEnded,
  trpc.trainingRecords.getById,
  trpc.trainingRecords.getByExpiringBefore,
];
