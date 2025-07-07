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
import { useQuery } from "@tanstack/react-query";

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
  const volunteerQuery = useQuery(
    trpc.volunteers.getById.queryOptions({ id: volunteerId })
  );
  const volunteer = volunteerQuery.data;

  const volunteerLogModalColumns: TableColumn<
    VolunteerFull["volunteerLogs"][number]
  >[] = [
    { key: "date", header: "Date" },
    {
      key: "client",
      header: "Client",
      render: (item) =>
        item.clients.map((client) => client.details.name).join(", "),
    },
    {
      key: "services",
      header: "Service(s)",
      render: (item) => item.details.services.join(", "),
    },
    { key: "notes", header: "Notes" },
  ];

  const trainingRecordModalColumns: TableColumn<
    VolunteerFull["trainingRecords"][number]
  >[] = [
    { key: "recordName", header: "Title" },
    { key: "recordExpiry", header: "Expiry" },
  ];

  const renderDetailItem = (
    label: string,
    value?: string | string[] | number
  ) => {
    if (
      value === undefined ||
      value === null ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return null;
    }
    return (
      <div className="mb-2">
        <span className="font-semibold text-gray-700">{label}: </span>
        <span className="text-gray-600">
          {Array.isArray(value) ? value.join(", ") : value}
        </span>
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
            contact info, offerings, training records, and activity logs.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2">
          <Tabs defaultValue="contact" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="contact">Contact Info</TabsTrigger>
              <TabsTrigger value="offerings">Offerings</TabsTrigger>
              <TabsTrigger value="training">Training Record</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            <TabsContent
              value="contact"
              className="p-4 border rounded-lg bg-white/80"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Contact Information
              </h3>
              {renderDetailItem("ID", volunteer.id)}
              {renderDetailItem("Name", volunteer.details.name)}
              {renderDetailItem("Address", volunteer.details.address)}
              {renderDetailItem("Post Code", volunteer.postCode)}
              {renderDetailItem("Phone", volunteer.details.phone)}
              {renderDetailItem("Email", volunteer.details.email)}
              {renderDetailItem("Next of Kin", volunteer.details.nextOfKin)}
              {renderDetailItem("DBS Number", volunteer.recordName)}
              {renderDetailItem("DBS Expiry", volunteer.recordExpiry)}
              {renderDetailItem("Date of Birth", volunteer.dateOfBirth)}
            </TabsContent>

            <TabsContent
              value="offerings"
              className="p-4 border rounded-lg bg-white/80"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Offerings
              </h3>
              {renderDetailItem("Services", volunteer.details.services)}
              {renderDetailItem("Specialisms", volunteer.details.specialisms)}
              {renderDetailItem(
                "Transport",
                volunteer.details.transport ? "Yes" : "No"
              )}
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
                Volunteer Logs
              </h3>
              {volunteer.volunteerLogs.length > 0 ? (
                <DataTable
                  data={volunteer.volunteerLogs}
                  columns={volunteerLogModalColumns}
                  title=""
                  searchPlaceholder="Search volunteer logs..."
                  resource="volunteerLogs"
                />
              ) : (
                <p className="text-sm text-gray-500">
                  No logs found for this volunteer.
                </p>
              )}
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
