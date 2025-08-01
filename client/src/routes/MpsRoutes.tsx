import { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Button } from "../components/ui/button";
import { MpForm } from "../pages/MpForm";
import { MpDetailModal } from "../components/MpDetailModal";
import { trpc } from "../utils/trpc";
import type { MpMetadata, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calculateAgeBracket } from "../utils/helpers";

const mpColumns: TableColumn<MpMetadata>[] = [
  { key: "id", header: "ID", render: (item: MpMetadata) => item.id },
  {
    key: "name",
    header: "Name",
    render: (item: MpMetadata) => item.details.name,
  },
  {
    key: "dob",
    header: "Age",
    render: (item: MpMetadata) =>
      item.dateOfBirth
        ? calculateAgeBracket(item.dateOfBirth) + " years"
        : "Unknown",
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
    render: (item: MpMetadata) => item.dbsExpiry,
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

  const handleViewMp = (mp: MpMetadata) => {
    setSelectedMpId(mp.id);
    setIsMpModalOpen(true);
  };

  const handleCloseMpModal = () => {
    setIsMpModalOpen(false);
    setSelectedMpId(null);
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
              onViewItem={handleViewMp as (item: unknown) => void}
              onAddNew={handleAddNew}
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
