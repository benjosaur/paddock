import { useState, useEffect } from "react";
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
import { DataTable } from "../tables/DataTable";
import { Note, NotesEditor } from "../NotesEditor";
import { PermissionGate } from "../PermissionGate";
import { DeleteAlert } from "../DeleteAlert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { packageColumns } from "@/routes/PackageRoutes";
import { formatYmdToDmy } from "@/utils/date";
import { TrainingRecordsTable } from "../tables/TrainingRecordsTable";

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
  const [currentNotes, setCurrentNotes] = useState<
    {
      date: string;
      note: string;
      source: "Phone" | "Email" | "In Person";
      minutesTaken: number;
    }[]
  >([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Update local notes when mp data changes
  useEffect(() => {
    if (mp?.details.notes) {
      setCurrentNotes(mp.details.notes);
    }
  }, [mp?.details.notes]);

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
    })
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
    value?: string | string[] | number | object
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
        <div className="flex-grow overflow-y-auto pr-2">
          <Tabs defaultValue="contact" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="contact">General Info</TabsTrigger>
              <TabsTrigger value="Services">Services</TabsTrigger>
              <TabsTrigger value="training">Training Records</TabsTrigger>
              <TabsTrigger value="logs">Packages</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent
              value="contact"
              className="p-4 border rounded-lg bg-white/80"
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
                mp.details.startDate ? formatYmdToDmy(mp.details.startDate) : ""
              )}
              {renderDetailItem(
                "End Date",
                mp.endDate === "open"
                  ? "Ongoing"
                  : mp.endDate
                  ? formatYmdToDmy(mp.endDate)
                  : ""
              )}
              {renderDetailItem("Next of Kin", mp.details.nextOfKin)}
              {renderDetailItem(
                "DBS Expiry",
                mp.dbsExpiry ? formatYmdToDmy(mp.dbsExpiry) : undefined
              )}
              {renderDetailItem(
                "Public Liability Expiry",
                mp.publicLiabilityExpiry
                  ? formatYmdToDmy(mp.publicLiabilityExpiry)
                  : undefined
              )}
              {renderDetailItem(
                "Date of Birth",
                mp.dateOfBirth ? formatYmdToDmy(mp.dateOfBirth) : ""
              )}
            </TabsContent>

            <TabsContent
              value="Services"
              className="p-4 border rounded-lg bg-white/80"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Services
              </h3>
              {renderDetailItem("Services", mp.details.services)}
              {renderDetailItem("Capacity", mp.details.capacity)}
            </TabsContent>

            <TabsContent
              value="training"
              className="p-4 border rounded-lg bg-white/80"
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
              className="p-4 border rounded-lg bg-white/80"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Packages
              </h3>
              {mp.requests.flatMap((req) => req.packages).length > 0 ? (
                <DataTable
                  data={mp.requests.flatMap((req) => req.packages)}
                  columns={packageColumns}
                  title=""
                  searchPlaceholder="Search packages..."
                  resource="packages"
                />
              ) : (
                <p className="text-sm text-gray-500">
                  No packages found for this MP.
                </p>
              )}
            </TabsContent>

            <TabsContent
              value="notes"
              className="p-4 border rounded-lg bg-white/80 space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-700">Notes</h3>
              <NotesEditor
                onSubmit={handleNotesSubmit}
                isPending={updateMpMutation.isPending}
                notes={currentNotes}
                onChange={setCurrentNotes}
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
