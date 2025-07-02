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
import type { MpFull, TableColumn } from "../types";
import { DataTable } from "./DataTable";
import { useQuery } from "@tanstack/react-query";

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
  const mpQuery = useQuery(trpc.mps.getById.queryOptions({ id: mpId }));
  const mp = mpQuery.data;

  const mpLogModalColumns: TableColumn<MpFull["mpLogs"][number]>[] = [
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
    MpFull["trainingRecords"][number]
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

  if (!mp) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[80vw] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            MP Details: {mp.details.name}
          </DialogTitle>
          <DialogDescription>
            View and manage detailed information for this MP including contact
            info, offerings, training records, and activity logs.
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
              {renderDetailItem("ID", mp.id)}
              {renderDetailItem("Name", mp.details.name)}
              {renderDetailItem("Address", mp.details.address)}
              {renderDetailItem("Post Code", mp.postCode)}
              {renderDetailItem("Phone", mp.details.phone)}
              {renderDetailItem("Email", mp.details.email)}
              {renderDetailItem("Next of Kin", mp.details.nextOfKin)}
              {renderDetailItem("DBS Number", mp.recordName)}
              {renderDetailItem("DBS Expiry", mp.recordExpiry)}
              {renderDetailItem("Date of Birth", mp.dateOfBirth)}
            </TabsContent>

            <TabsContent
              value="offerings"
              className="p-4 border rounded-lg bg-white/80"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Offerings
              </h3>
              {renderDetailItem("Services", mp.details.services)}
              {renderDetailItem("Specialisms", mp.details.specialisms)}
              {renderDetailItem(
                "Transport",
                mp.details.transport ? "Yes" : "No"
              )}
              {renderDetailItem("Capacity", mp.details.capacity)}
            </TabsContent>

            <TabsContent
              value="training"
              className="p-4 border rounded-lg bg-white/80"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Training Record
              </h3>
              {mp.trainingRecords.length > 0 ? (
                <DataTable
                  data={mp.trainingRecords}
                  columns={trainingRecordModalColumns}
                  title=""
                  searchPlaceholder="Search training records..."
                  resource="mps"
                />
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
                MP Logs
              </h3>
              {mp.mpLogs.length > 0 ? (
                <DataTable
                  data={mp.mpLogs}
                  columns={mpLogModalColumns}
                  title=""
                  searchPlaceholder="Search MP logs..."
                  resource="mpLogs"
                />
              ) : (
                <p className="text-sm text-gray-500">
                  No logs found for this MP.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter className="mt-4">
          {mp && (
            <>
              {onEdit && (
                <Button onClick={() => onEdit(mp.id)} variant="default">
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button onClick={() => onDelete(mp.id)} variant="destructive">
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
