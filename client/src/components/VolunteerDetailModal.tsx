import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { trpc } from "../utils/trpc";
import type { VolunteerFull, TableColumn } from "../types";
import { DataTable } from "./DataTable";
import { NotesEditor } from "./NotesEditor";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  const [currentNotes, setCurrentNotes] = useState<
    { date: string; note: string; source: "Phone" | "Email" | "In Person"; minutesTaken: number }[]
  >([]);

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

  const handleNotesSubmit = () => {
    if (volunteer) {
      updateVolunteerMutation.mutate({
        ...volunteer,
        details: {
          ...volunteer.details,
          notes: currentNotes,
        },
      });
    }
  };

  const packageModalColumns: TableColumn<
    VolunteerFull["requests"][number]["packages"][number]
  >[] = [
    {
      key: "startDate",
      header: "Start Date",
      render: (item) => item.startDate,
    },
    {
      key: "endDate",
      header: "End Date",
      render: (item) => item.endDate,
    },
    {
      key: "name",
      header: "Carer Name",
      render: (item) => item.details.name,
    },
    {
      key: "services",
      header: "Service(s)",
      render: (item) => item.details.services.join(", "),
    },
    {
      key: "weeklyHours",
      header: "Weekly Hours",
      render: (item) => item.details.weeklyHours.toString(),
    },
    {
      key: "notes",
      header: "Notes",
      render: (item) => item.details.notes,
    },
  ];

  const trainingRecordModalColumns: TableColumn<
    VolunteerFull["trainingRecords"][number]
  >[] = [
    {
      key: "name",
      header: "Title",
      render: (item) => item.details.name,
    },
    {
      key: "expiryDate",
      header: "Expiry",
      render: (item) => item.expiryDate || "N/A",
    },
  ];

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
          <DialogDescription>
            View and manage detailed information for this volunteer including
            General Info, Services, training records, and activity logs.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2">
          <Tabs defaultValue="contact" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="contact">General Info</TabsTrigger>
              <TabsTrigger value="Services">Services</TabsTrigger>
              <TabsTrigger value="training">Training Record</TabsTrigger>
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
              {renderDetailItem("Role", volunteer.details.currentRole)}
              {renderDetailItem("Address", volunteer.details.address)}
              {renderDetailItem("Phone", volunteer.details.phone)}
              {renderDetailItem("Email", volunteer.details.email)}
              {renderDetailItem("Next of Kin", volunteer.details.nextOfKin)}
              {renderDetailItem("DBS Expiry", volunteer.dbsExpiry)}
              {renderDetailItem(
                "Public Liability Expiry",
                volunteer.publicLiabilityExpiry
              )}
              {renderDetailItem("Date of Birth", volunteer.dateOfBirth)}
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
                Training Record
              </h3>
              {volunteer.trainingRecords.length > 0 ? (
                <DataTable
                  data={volunteer.trainingRecords}
                  columns={trainingRecordModalColumns}
                  title=""
                  searchPlaceholder="Search training records..."
                  resource="volunteers"
                />
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
              {volunteer.requests.flatMap((req) => req.packages).length > 0 ? (
                <DataTable
                  data={volunteer.requests.flatMap((req) => req.packages)}
                  columns={packageModalColumns}
                  title=""
                  searchPlaceholder="Search packages..."
                  resource="packages"
                />
              ) : (
                <p className="text-sm text-gray-500">
                  No packages found for this volunteer.
                </p>
              )}
            </TabsContent>

            <TabsContent
              value="notes"
              className="p-4 border rounded-lg bg-white/80 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-700">Notes</h3>
                <Button
                  onClick={handleNotesSubmit}
                  disabled={updateVolunteerMutation.isPending}
                  size="sm"
                  className="ml-auto"
                >
                  {updateVolunteerMutation.isPending
                    ? "Saving..."
                    : "Save Notes"}
                </Button>
              </div>
              <NotesEditor notes={currentNotes} onChange={setCurrentNotes} />
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter className="mt-4">
          {volunteer && (
            <>
              {onEdit && (
                <Button onClick={() => onEdit(volunteer.id)} variant="default">
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  onClick={() => onDelete(volunteer.id)}
                  variant="destructive"
                >
                  Delete
                </Button>
              )}
            </>
          )}
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
