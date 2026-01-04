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
import { Note, NotesEditor } from "../NotesEditor";
import { PermissionGate } from "../PermissionGate";
import { DeleteAlert } from "../DeleteAlert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatYmdToDmy } from "@/utils/date";
import { TrainingRecordsTable } from "../tables/TrainingRecordsTable";
import { CarerPackagesTable } from "../tables/CarerPackagesTable";

interface VolunteerDetailModalProps {
  volunteerId: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function VolunteerDetailModal({
  volunteerId,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: VolunteerDetailModalProps) {
  const queryClient = useQueryClient();
  const volunteerQuery = useQuery(
    trpc.volunteers.getById.queryOptions({ id: volunteerId })
  );
  const volunteer = volunteerQuery.data;
  const [currentNotes, setCurrentNotes] = useState<Note[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Update local notes when volunteer data changes
  useEffect(() => {
    if (volunteer?.details.notes) {
      setCurrentNotes(volunteer.details.notes);
    }
  }, [volunteer?.details.notes]);

  const updateVolunteerMutation = useMutation(
    trpc.volunteers.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.volunteers.getById.queryKey({ id: volunteerId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.volunteers.getAll.queryKey(),
        });
      },
    })
  );

  const handleNotesSubmit = (notes: Note[]) => {
    if (volunteer) {
      updateVolunteerMutation.mutate({
        ...volunteer,
        details: {
          ...volunteer.details,
          notes,
        },
      });
      queryClient.invalidateQueries({
        queryKey: trpc.volunteers.getById.queryKey({ id: volunteerId }),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.volunteers.getAll.queryKey(),
      });
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (onDelete && volunteer) {
      onDelete(volunteer.id);
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

  if (!volunteer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[80vw] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Volunteer Details: {volunteer.details.name}
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
              {renderDetailItem("ID", volunteer.id)}
              {renderDetailItem("Name", volunteer.details.name)}
              {renderDetailItem("Role", volunteer.details.role)}
              {renderDetailItem("Address", volunteer.details.address)}
              {renderDetailItem("Phone", volunteer.details.phone)}
              {renderDetailItem("Email", volunteer.details.email)}
              {renderDetailItem(
                "Start Date",
                volunteer.details.startDate
                  ? formatYmdToDmy(volunteer.details.startDate)
                  : ""
              )}
              {renderDetailItem(
                "End Date",
                volunteer.endDate === "open"
                  ? "Ongoing"
                  : volunteer.endDate
                  ? formatYmdToDmy(volunteer.endDate)
                  : ""
              )}
              {renderDetailItem("Next of Kin", volunteer.details.nextOfKin)}
              {renderDetailItem(
                "DBS Expiry",
                volunteer.dbsExpiry
                  ? formatYmdToDmy(volunteer.dbsExpiry)
                  : undefined
              )}
              {renderDetailItem(
                "Public Liability Expiry",
                volunteer.publicLiabilityExpiry
                  ? formatYmdToDmy(volunteer.publicLiabilityExpiry)
                  : undefined
              )}
              {renderDetailItem(
                "Date of Birth",
                volunteer.dateOfBirth
                  ? formatYmdToDmy(volunteer.dateOfBirth)
                  : ""
              )}
            </TabsContent>

            <TabsContent
              value="Services"
              className="p-4 border rounded-lg bg-white/80"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Services
              </h3>
              {renderDetailItem("Services", volunteer.details.services)}
              {renderDetailItem("Capacity", volunteer.details.capacity)}
            </TabsContent>

            <TabsContent
              value="training"
              className="p-4 border rounded-lg bg-white/80"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Training Records
              </h3>
              {volunteer.trainingRecords.length > 0 ? (
                <TrainingRecordsTable data={volunteer.trainingRecords} />
              ) : (
                <p className="text-sm text-gray-500">
                  No training records found for this volunteer.
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
              <CarerPackagesTable
                key={`${volunteerId}-carer-packages`}
                carerId={volunteerId}
                requests={volunteer.requests}
              />
            </TabsContent>

            <TabsContent
              value="notes"
              className="p-4 border rounded-lg bg-white/80 space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-700">Notes</h3>
              <NotesEditor
                onSubmit={handleNotesSubmit}
                isPending={updateVolunteerMutation.isPending}
                notes={currentNotes}
                onChange={setCurrentNotes}
              />
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter className="mt-4">
          <div className="flex gap-2">
            <PermissionGate resource="volunteers" action="update">
              {onEdit && (
                <Button onClick={() => onEdit(volunteer.id)} variant="default">
                  Edit
                </Button>
              )}
            </PermissionGate>
            <PermissionGate resource="volunteers" action="delete">
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
        itemName={volunteer?.details.name}
        itemType="volunteer"
      />
    </Dialog>
  );
}
