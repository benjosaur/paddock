import { EndTrainingRecordDetails, TrainingRecord } from "shared";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { associatedRecordRoutes } from "@/routes/RecordsRoutes";
import { DataTable } from "./DataTable";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import EndDialog from "../EndDialog";
import { TableColumn } from "@/types";
import { formatYmdToDmy } from "@/utils/date";
import { trpc } from "@/utils/trpc";

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

interface TrainingRecordsTableProps {
  data: TrainingRecord[];
}

export function TrainingRecordsTable({ data }: TrainingRecordsTableProps) {
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [endDetails, setEndDetails] = useState<EndTrainingRecordDetails | null>(
    null
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  return (
    <>
      <DataTable<TrainingRecord>
        data={data}
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
            setEndDetails((prev) => (prev ? { ...prev, endDate: date } : prev))
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
      ;
    </>
  );
}
