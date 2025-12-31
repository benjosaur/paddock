import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { trpc } from "../../utils/trpc";
import { DataTable } from "../tables/DataTable";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatYmdToDmy } from "@/utils/date";
import { isIdMp, isIdVolunteer } from "shared/utils";
import { EndTrainingRecordDetails, TrainingRecord } from "shared";
import { useNavigate } from "react-router-dom";
import { associatedRecordRoutes } from "@/routes/RecordsRoutes";
import EndDialog from "../EndDialog";
import { TableColumn } from "@/types";

export const trainingRecordColumns: TableColumn<TrainingRecord>[] = [
  {
    key: "personName",
    header: "Name",
    render: (item) => item.details.name,
  },
  {
    key: "recordName",
    header: "Training Record",
    render: (item) => item.details.recordName,
  },
  {
    key: "recordNumber",
    header: "Training Record Number",
    render: (item) => item.details.recordNumber,
  },
  {
    key: "date",
    header: "Expiry Date",
    render: (item) => formatYmdToDmy(item.expiryDate || ""),
  },
  {
    key: "notes",
    header: "Notes",
    render: (item) => item.details.notes,
  },
];

interface TrainingRecordDetailModalProps {
  carerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TrainingRecordDetailModal({
  carerId,
  isOpen,
  onClose,
}: TrainingRecordDetailModalProps) {
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [endDetails, setEndDetails] = useState<EndTrainingRecordDetails | null>(
    null
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mpQuery = useQuery({
    ...trpc.mps.getById.queryOptions({ id: carerId }), // assertion that not undef as a result of enabled condition
    enabled: isIdMp(carerId),
  });

  const volunteerQuery = useQuery({
    ...trpc.volunteers.getById.queryOptions({ id: carerId }), // assertion that not undef as a result of enabled condition
    enabled: isIdVolunteer(carerId),
  });

  const carer = mpQuery.data || volunteerQuery.data;

  const deleteRecordMutation = useMutation(
    trpc.trainingRecords.delete.mutationOptions({
      onSuccess: () => {
        associatedRecordRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  const endRecordMutation = useMutation(
    trpc.trainingRecords.end.mutationOptions({
      onSuccess: () => {
        associatedRecordRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  const handleEditRecord = (item: TrainingRecord) => {
    const encodedId = encodeURIComponent(item.id);
    const encodedOwnerId = encodeURIComponent(item.ownerId);
    navigate(`/records/edit?id=${encodedId}&ownerId=${encodedOwnerId}`);
  };

  const handleDeleteRecord = (item: TrainingRecord) => {
    deleteRecordMutation.mutate({ id: item.id, ownerId: item.ownerId });
  };

  const handleEnd = (item: TrainingRecord) => {
    // Only allow end from non-Ended view; un-end is not supported for training records
    if (item.endDate === "open") {
      setEndDetails({ ownerId: item.ownerId, recordId: item.id, endDate: "" });
      setIsEndDialogOpen(true);
    }
  };
  if (!carer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[80vw] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Training Records {carer.details.name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Records</h3>
          {carer.trainingRecords.length > 0 ? (
            <>
              <DataTable<TrainingRecord>
                data={carer.trainingRecords}
                columns={trainingRecordColumns}
                title=""
                onEditRecord={handleEditRecord}
                onDeleteRecord={handleDeleteRecord}
                onEnd={handleEnd}
                searchPlaceholder="Search training records..."
                resource="trainingRecords"
              />
              <div>
                <EndDialog
                  isOpen={isEndDialogOpen}
                  onOpenChange={(open) => {
                    setIsEndDialogOpen(open);
                    if (!open) setEndDetails(null);
                  }}
                  entityLabel="Training Record"
                  endDate={endDetails?.endDate}
                  onEndDateChange={(date) =>
                    setEndDetails((prev) =>
                      prev ? { ...prev, endDate: date } : prev
                    )
                  }
                  onConfirm={() => {
                    if (
                      !endDetails?.ownerId ||
                      !endDetails.recordId ||
                      !endDetails.endDate
                    )
                      return;
                    endRecordMutation.mutate(endDetails);
                    setIsEndDialogOpen(false);
                    setEndDetails(null);
                  }}
                  confirmDisabled={
                    !endDetails?.endDate ||
                    !endDetails?.ownerId ||
                    !endDetails?.recordId ||
                    endRecordMutation.isPending
                  }
                  endDescription="Select an end date. This will archive the training record."
                  undoDescription=""
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              No new trainingRecords found for this carer.
            </p>
          )}
        </div>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
