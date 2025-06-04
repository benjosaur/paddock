import { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { MpForm } from "../pages/MpForm";
import { MpDetailModal } from "../components/MpDetailModal";
import { trpc } from "../utils/trpc";
import type { Mp, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calculateAgeBracket } from "../utils/helpers";

const mpColumns: TableColumn<Mp>[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  {
    key: "dob",
    header: "Age",
    render: (item: Mp) =>
      item.dob ? calculateAgeBracket(item.dob) + " years" : "Unknown",
  },
  { key: "postCode", header: "Post Code" },
  {
    key: "servicesOffered",
    header: "Services",
    render: (item: Mp) => item.servicesOffered.join(", "),
  },
  { key: "dbsExpiry", header: "DBS Expiry" },
  { key: "capacity", header: "Capacity?" },
  { key: "transport", header: "Transport?" },
];

export function MpsRoutes() {
  const navigate = useNavigate();
  const [selectedMp, setSelectedMp] = useState<Mp | null>(null);
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

  const handleEditNavigation = (id: number) => {
    navigate(`/mps/edit/${id}`);
  };

  const handleDelete = (id: number) => {
    deleteMpMutation.mutate({ id });
  };

  const handleViewMp = (mp: Mp) => {
    setSelectedMp(mp);
    setIsMpModalOpen(true);
  };

  const handleCloseMpModal = () => {
    setIsMpModalOpen(false);
    setSelectedMp(null);
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
            />
            <MpDetailModal
              mp={selectedMp}
              isOpen={isMpModalOpen}
              onClose={handleCloseMpModal}
            />
          </>
        }
      />
      <Route path="create" element={<MpForm />} />
      <Route path="edit/:id" element={<MpForm />} />
    </Routes>
  );
}

export default MpsRoutes;
