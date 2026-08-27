import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { trpc } from "../../utils/trpc";
import { Timeline } from "../timeline/Timeline";
import { buildMpTimeline } from "../timeline/build";
import type { Note } from "../timeline/model";
import { PermissionGate } from "../PermissionGate";
import { DeleteAlert } from "../DeleteAlert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatYmdToDmy } from "@/utils/date";
import { TrainingRecordsTable } from "../tables/TrainingRecordsTable";
import { CarerPackagesTable } from "../tables/CarerPackagesTable";

interface MpDetailModalProps {
  mpId: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function MpDetailModal({
  mpId,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: MpDetailModalProps) {
  const queryClient = useQueryClient();
  const mpQuery = useQuery(trpc.mps.getById.queryOptions({ id: mpId }));
  const mp = mpQuery.data;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const timeline = useMemo(() => (mp ? buildMpTimeline(mp) : null), [mp]);

  const updateMpMutation = useMutation(
    trpc.mps.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.mps.getById.queryKey({ id: mpId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.mps.getAll.queryKey(),
        });
      },
    }),
  );

  const handleNotesSubmit = (notes: Note[]) => {
    if (mp) {
      updateMpMutation.mutate({
        ...mp,
        details: {
          ...mp.details,
          notes,
        },
      });
      queryClient.invalidateQueries({
        queryKey: trpc.mps.getById.queryKey({ id: mpId }),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.mps.getAll.queryKey(),
      });
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (onDelete && mp) {
      onDelete(mp.id);
    }
    setDeleteDialogOpen(false);
    onClose(); // Close the main modal after deletion
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const renderDetailItem = (
    label: string,
    value?: string | string[] | number | object,
  ) => {
    if (
      value === undefined ||
      value === null ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return null;
    }

    let displayValue: string;
    if (typeof value === "object" && !Array.isArray(value)) {
      // Handle address object
      const addr = value as {
        streetAddress: string;
        locality: string;
        county: string;
        postCode: string;
      };
      displayValue = [
        addr.streetAddress,
        addr.locality,
        addr.county,
        addr.postCode,
      ]
        .filter(Boolean)
        .join(", ");
    } else {
      displayValue = Array.isArray(value) ? value.join(", ") : String(value);
    }

    return (
      <div className="mb-2">
        <span className="font-semibold text-gray-700">{label}: </span>
        <span className="text-gray-600">{displayValue}</span>
      </div>
    );
  };

  if (!mp) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[80vw] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            MP Details: {mp.details.name}
          </DialogTitle>
        </DialogHeader>
        {/* min-h-0 down the chain so the Timeline tab owns its own scroll
            region; the other tabs scroll their content themselves. */}
        <div className="flex min-h-0 flex-grow flex-col pr-2">
          <Tabs
            defaultValue="timeline"
            className="mt-4 flex min-h-0 w-full flex-1 flex-col"
          >
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="contact">General Info</TabsTrigger>
              <TabsTrigger value="training">Training Records</TabsTrigger>
              <TabsTrigger value="logs">Care Confirmed</TabsTrigger>
            </TabsList>

            <TabsContent
              value="timeline"
              className="flex min-h-0 flex-1 flex-col p-4 border rounded-lg bg-white/80"
            >
              {timeline && (
                <Timeline
                  data={timeline}
                  personName={mp.details.name}
                  ownerId={mp.id}
                  resource="mps"
                  notes={mp.details.notes}
                  onSaveNotes={handleNotesSubmit}
                  isSavingNotes={updateMpMutation.isPending}
                />
              )}
            </TabsContent>

            <TabsContent
              value="contact"
              className="min-h-0 overflow-y-auto p-4 border rounded-lg bg-white/80"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                General Information
              </h3>
              {renderDetailItem("ID", mp.id)}
              {renderDetailItem("Name", mp.details.name)}
              {renderDetailItem("Address", mp.details.address)}
              {renderDetailItem("Phone", mp.details.phone)}
              {renderDetailItem("Email", mp.details.email)}
              {renderDetailItem(
                "Start Date",
                mp.details.startDate
                  ? formatYmdToDmy(mp.details.startDate)
                  : "",
              )}
              {renderDetailItem(
                "End Date",
                mp.endDate === "open"
                  ? "Ongoing"
                  : mp.endDate
                    ? formatYmdToDmy(mp.endDate)
                    : "",
              )}
              {renderDetailItem("Next of Kin", mp.details.nextOfKin)}
              {renderDetailItem(
                "DBS Expiry",
                mp.dbsExpiry ? formatYmdToDmy(mp.dbsExpiry) : undefined,
              )}
              {renderDetailItem(
                "Public Liability Expiry",
                mp.publicLiabilityExpiry
                  ? formatYmdToDmy(mp.publicLiabilityExpiry)
                  : undefined,
              )}
              {renderDetailItem(
                "End Date",
                mp.feePaymentDate === "unpaid"
                  ? "Unpaid"
                  : mp.feePaymentDate
                    ? formatYmdToDmy(mp.feePaymentDate)
                    : "",
              )}
              {renderDetailItem(
                "Date of Birth",
                mp.dateOfBirth ? formatYmdToDmy(mp.dateOfBirth) : "",
              )}
            </TabsContent>

            <TabsContent
              value="training"
              className="min-h-0 overflow-y-auto p-4 border rounded-lg bg-white/80"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Training Records
              </h3>
              {mp.trainingRecords.length > 0 ? (
                <TrainingRecordsTable data={mp.trainingRecords} />
              ) : (
                <p className="text-sm text-gray-500">
                  No training records found for this MP.
                </p>
              )}
            </TabsContent>

            <TabsContent
              value="logs"
              className="min-h-0 overflow-y-auto p-4 border rounded-lg bg-white/80"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Care Confirmed
              </h3>
              <CarerPackagesTable
                key={`${mpId}-carer-packages`}
                carerId={mpId}
                requests={mp.requests}
              />
            </TabsContent>

          </Tabs>
        </div>
        <DialogFooter className="mt-4">
          <div className="flex gap-2">
            <PermissionGate resource="mps" action="update">
              {onEdit && (
                <Button onClick={() => onEdit(mp.id)} variant="default">
                  Edit
                </Button>
              )}
            </PermissionGate>
            <PermissionGate resource="mps" action="delete">
              {onDelete && (
                <Button onClick={handleDeleteClick} variant="destructive">
                  Delete
                </Button>
              )}
            </PermissionGate>
          </div>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>

      <DeleteAlert
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        itemName={mp?.details.name}
        itemType="MP"
      />
    </Dialog>
  );
}
