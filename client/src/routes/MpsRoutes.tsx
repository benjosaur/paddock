import { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Button } from "../components/ui/button";
import { MpForm } from "../pages/MpForm";
import { MpDetailModal } from "../components/MpDetailModal";
import { trpc } from "../utils/trpc";
import type { MpMetadata, TableColumn } from "../types";
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

const mpColumns: TableColumn<MpMetadata>[] = [
  {
    key: "name",
    header: "Name",
    render: (item: MpMetadata) => item.details.name,
  },
  {
    key: "dob",
    header: "Date of Birth",
    render: (item: MpMetadata) => item.dateOfBirth || "Unknown",
  },
  {
    key: "postCode",
    header: "Post Code",
    render: (item: MpMetadata) => item.details.address.postCode,
  },
  {
    key: "services",
    header: "Services",
    render: (item: MpMetadata) => item.details.services.join(", "),
  },
  {
    key: "dbsExpiry",
    header: "DBS Expiry",
    render: (item: MpMetadata) => item.dbsExpiry || "No DBS",
  },
  {
    key: "capacity",
    header: "Capacity?",
    render: (item: MpMetadata) => item.details.capacity,
  },
];

export function MpsRoutes() {
  const navigate = useNavigate();
  const [selectedMpId, setSelectedMpId] = useState<string | null>(null);
  const [isMpModalOpen, setIsMpModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [endDetails, setEndDetails] = useState<EndPersonDetails | null>(null);

  const queryClient = useQueryClient();

  const mpsQuery = useQuery(
    showArchived
      ? trpc.mps.getAll.queryOptions()
      : trpc.mps.getAllNotArchived.queryOptions()
  );
  const mpsQueryKey = showArchived
    ? trpc.mps.getAll.queryKey()
    : trpc.mps.getAllNotArchived.queryKey();

  const archiveMpMutation = useMutation(
    trpc.mps.toggleArchive.mutationOptions({
      onSuccess: () => {
        // Invalidate all associated routes
        associatedMpRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  const deleteMpMutation = useMutation(
    trpc.mps.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mpsQueryKey });
      },
    })
  );

  const endMpMutation = useMutation(
    trpc.mps.end.mutationOptions({
      onSuccess: () => {
        associatedMpRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  const handleAddNew = () => {
    navigate("/mps/create");
  };

  const handleArchiveToggle = (id: string) => {
    archiveMpMutation.mutate({ id });
  };

  const handleEditNavigation = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/mps/edit/${encodedId}`);
  };

  const handleDelete = (id: string) => {
    deleteMpMutation.mutate({ id });
  };

  const handleAddRecord = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/records/create?ownerId=${encodedId}`);
  };

  const handleViewMp = (id: string) => {
    setSelectedMpId(id);
    setIsMpModalOpen(true);
  };

  const handleCloseMpModal = () => {
    setIsMpModalOpen(false);
    setSelectedMpId(null);
  };

  const handleEnd = (id: string) => {
    setEndDetails({ personId: id, endDate: "" });
    setIsEndDialogOpen(true);
  };

  if (mpsQuery.isLoading) return <div>Loading...</div>;
  if (mpsQuery.error) return <div>Error loading MPs</div>;

  return (
    <Routes>
      <Route
        index
        element={
          <>
            <DataTable
              key={`mps-${showArchived}`}
              title="MPs"
              searchPlaceholder="Search MPs..."
              data={mpsQuery.data || []}
              columns={mpColumns}
              onArchive={handleArchiveToggle}
              onEdit={handleEditNavigation}
              onDelete={handleDelete}
              onAddRecord={handleAddRecord}
              onEnd={handleEnd}
              onViewItem={handleViewMp as (item: unknown) => void}
              onCreate={handleAddNew}
              resource="mps"
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
            {selectedMpId && (
              <MpDetailModal
                mpId={selectedMpId}
                isOpen={isMpModalOpen}
                onClose={handleCloseMpModal}
                onEdit={handleEditNavigation}
                onDelete={handleDelete}
              />
            )}
            <Dialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>End MP</DialogTitle>
                  <DialogDescription>
                    Select an end date. This will also archive the MP.
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
                      endMpMutation.isPending
                    }
                    onClick={() => {
                      if (!endDetails?.personId || !endDetails.endDate) return;
                      endMpMutation.mutate(endDetails);
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
      <Route path="create" element={<MpForm />} />
      <Route path="edit/:id" element={<MpForm />} />
    </Routes>
  );
}

export default MpsRoutes;

export const associatedMpRoutes: any[] = [
  // Mps
  trpc.mps.getAll,
  trpc.mps.getAllNotArchived,
  trpc.mps.getById,

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
