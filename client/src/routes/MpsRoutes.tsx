import { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Button } from "../components/ui/button";
import { MpForm } from "../pages/MpForm";
import { MpDetailModal } from "../components/MpDetailModal";
import { trpc } from "../utils/trpc";
import { formatYmdToDmy } from "@/utils/date";
import type { MpMetadata, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EndPersonDetails } from "shared";
import EndDialog from "../components/EndDialog";

const mpColumns: TableColumn<MpMetadata>[] = [
  {
    key: "name",
    header: "Name",
    render: (item: MpMetadata) => item.details.name,
  },
  {
    key: "dob",
    header: "Date of Birth",
    render: (item: MpMetadata) =>
      item.dateOfBirth ? formatYmdToDmy(item.dateOfBirth) : "Unknown",
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
  const [showEnded, setShowEnded] = useState(false);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [endDetails, setEndDetails] = useState<EndPersonDetails | null>(null);

  const queryClient = useQueryClient();

  const mpsQuery = useQuery(
    showEnded
      ? trpc.mps.getAll.queryOptions()
      : trpc.mps.getAllNotEndedYet.queryOptions()
  );
  const mpsQueryKey = showEnded
    ? trpc.mps.getAll.queryKey()
    : trpc.mps.getAllNotEndedYet.queryKey();

  const deleteMpMutation = useMutation(
    trpc.mps.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mpsQueryKey });
      },
    })
  );

  const updateMpMutation = useMutation(
    trpc.mps.update.mutationOptions({
      onSuccess: () => {
        associatedMpRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
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

  const handleEnd = (mp: MpMetadata) => {
    if (mp.endDate === "open") {
      setEndDetails({ personId: mp.id, endDate: "", endReason: "None" });
      setIsEndDialogOpen(true);
    } else {
      // undo end
      setEndDetails({ personId: mp.id, endDate: "open", endReason: "None" });
      setIsEndDialogOpen(true);
    }
  };

  const handleConfirmEnd = () => {
    if (!endDetails?.personId || !endDetails.endDate) return;
    if (endDetails.endDate === "open") {
      const selected = mpsQuery.data?.find((m) => m.id === endDetails.personId);
      if (!selected) return;
      updateMpMutation.mutate({
        ...selected,
        endDate: "open",
      } as unknown as any);
    } else {
      endMpMutation.mutate(endDetails);
    }
    setIsEndDialogOpen(false);
    setEndDetails(null);
  };

  if (mpsQuery.isLoading) return <div>Loading...</div>;
  if (mpsQuery.error) return <div>Error loading MPs</div>;

  // Ensure rows are shown in alphabetical order by MP name
  const sortedMps = (mpsQuery.data || []).slice().sort((a, b) =>
    a.details.name.localeCompare(b.details.name, undefined, {
      sensitivity: "base",
    })
  );

  return (
    <Routes>
      <Route
        index
        element={
          <>
            <DataTable
              key={`mps-${showEnded}`}
              title="MPs"
              searchPlaceholder="Search MPs..."
              data={sortedMps}
              columns={mpColumns}
              onEdit={handleEditNavigation}
              onDelete={handleDelete}
              onAddRecord={handleAddRecord}
              onEnd={handleEnd}
              onViewItem={handleViewMp}
              onCreate={handleAddNew}
              resource="mps"
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
            {selectedMpId && (
              <MpDetailModal
                mpId={selectedMpId}
                isOpen={isMpModalOpen}
                onClose={handleCloseMpModal}
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
              entityLabel="MP"
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
                endMpMutation.isPending
              }
              endDescription="Select an end date. This will also archive the MP."
              undoDescription="This will undo ending the MP. Associated packages will not be affected."
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

export const associatedMpRoutes: any[] = [
  // Mps
  trpc.mps.getAll,
  trpc.mps.getAllNotEndedYet,
  trpc.mps.getById,

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
  trpc.trainingRecords.getAllNotEndedYet,
  trpc.trainingRecords.getById,
  trpc.trainingRecords.getByExpiringBefore,
];
