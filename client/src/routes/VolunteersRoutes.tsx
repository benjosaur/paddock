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
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

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
  const [showArchived, setShowArchived] = useState(false);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [endDetails, setEndDetails] = useState<EndPersonDetails | null>(null);

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

  const handleEnd = (id: string) => {
    setEndDetails({ personId: id, endDate: "" });
    setIsEndDialogOpen(true);
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
              onEnd={handleEnd}
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
            <Dialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>End Volunteer</DialogTitle>
                  <DialogDescription>
                    Select an end date. This will also archive the volunteer.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <label className="text-sm text-gray-700">End Date</label>
                  <Input
                    type="date"
                    value={endDetails?.endDate ?? ""}
                    onChange={(e) =>
                      setEndDetails((prev) =>
                        prev ? { ...prev, endDate: e.target.value } : prev
                      )
                    }
                    required
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEndDialogOpen(false);
                      setEndDetails(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={
                      !endDetails?.endDate ||
                      !endDetails?.personId ||
                      endVolunteerMutation.isPending
                    }
                    onClick={() => {
                      if (!endDetails?.personId || !endDetails.endDate) return;
                      endVolunteerMutation.mutate(endDetails);
                      setIsEndDialogOpen(false);
                      setEndDetails(null);
                    }}
                  >
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
