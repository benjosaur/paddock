import { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { MpForm } from "../pages/MpForm";
import { MpDetailModal } from "../components/MpDetailModal";
import { trpc } from "../utils/trpc";
import type { MpMetadata, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calculateAgeBracket } from "../utils/helpers";

const mpColumns: TableColumn<MpMetadata>[] = [
  { key: "id", header: "ID" },
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
  { key: "postCode", header: "Post Code" },
  {
    key: "services",
    header: "Services",
    render: (item: MpMetadata) => item.details.services.join(", "),
  },
  {
    key: "dbsExpiry",
    header: "DBS Expiry",
    render: (item: MpMetadata) => item.recordExpiry,
  },
  {
    key: "capacity",
    header: "Capacity?",
    render: (item: MpMetadata) => item.details.capacity,
  },
  {
    key: "transport",
    header: "Transport?",
    render: (item: MpMetadata) => (item.details.transport ? "Yes" : "No"),
  },
];

export function MpsRoutes() {
  const navigate = useNavigate();
  const [selectedMpId, setSelectedMpId] = useState<string | null>(null);
  const [isMpModalOpen, setIsMpModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const mpsQuery = useQuery(trpc.mps.getAll.queryOptions());
  const mpsQueryKey = trpc.mps.getAll.queryKey();

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
              key="mps"
              title="MPs"
              searchPlaceholder="Search MPs..."
              data={mpsQuery.data || []}
              columns={mpColumns}
              onEdit={handleEditNavigation}
              onDelete={handleDelete}
              onViewItem={handleViewMp as (item: unknown) => void}
              onAddNew={handleAddNew}
              resource="mps"
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
