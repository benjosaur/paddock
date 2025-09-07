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
import { DataTable } from "./DataTable";
import { NotesEditor } from "./NotesEditor";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { magLogColumns } from "@/routes/MagLogRoutes";
import { requestColumns } from "@/routes/RequestRoutes";
import { packageColumns } from "@/routes/PackageRoutes";

interface ClientDetailModalProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ClientDetailModal({
  clientId,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: ClientDetailModalProps) {
  const queryClient = useQueryClient();
  const clientQuery = useQuery(
    trpc.clients.getById.queryOptions({ id: clientId })
  );
  const client = clientQuery.data;
  const [currentNotes, setCurrentNotes] = useState<
    {
      date: string;
      note: string;
      source: "Phone" | "Email" | "In Person";
      minutesTaken: number;
    }[]
  >([]);

  // Update local notes when client data changes
  useEffect(() => {
    if (client?.details.notes) {
      setCurrentNotes(client.details.notes);
    }
  }, [client?.details.notes]);

  const updateClientMutation = useMutation(
    trpc.clients.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.clients.getById.queryKey({ id: clientId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.clients.getAll.queryKey(),
        });
      },
    })
  );

  const handleNotesSubmit = () => {
    if (client) {
      updateClientMutation.mutate({
        ...client,
        details: {
          ...client.details,
          notes: currentNotes,
        },
      });
    }
  };

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

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[80vw] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Client Details: {client.details.name}
          </DialogTitle>
          <DialogDescription>
            View and manage detailed information for this client including
            contact info, services & needs, activity logs, and requests.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2">
          <Tabs defaultValue="contact" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="contact">Contact Info</TabsTrigger>
              <TabsTrigger value="services">Services & Needs</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="requests">New Requests</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent
              value="contact"
              className="p-4 border rounded-lg bg-white/80"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                General Info
              </h3>
              {renderDetailItem("ID", client.id)}
              {renderDetailItem("Date of Birth", client.dateOfBirth)}
              {renderDetailItem(
                "Street Address",
                client.details.address.streetAddress
              )}
              {renderDetailItem("Locality", client.details.address.locality)}
              {renderDetailItem("County", client.details.address.county)}
              {renderDetailItem("Post Code", client.details.address.postCode)}
              {renderDetailItem("Phone", client.details.phone)}
              {renderDetailItem("Email", client.details.email)}
              {renderDetailItem("Next of Kin", client.details.nextOfKin)}
              {renderDetailItem("Referred By/On", client.details.referredBy)}
            </TabsContent>

            <TabsContent
              value="services"
              className="p-4 border rounded-lg bg-white/80"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Services & Needs
              </h3>
              {renderDetailItem(
                "Client Agreement Date",
                client.details.clientAgreementDate
              )}
              {renderDetailItem(
                "Client Agreement Comments",
                client.details.clientAgreementComments
              )}
              {renderDetailItem(
                "Risk Assessment Date",
                client.details.riskAssessmentDate
              )}
              {renderDetailItem(
                "Risk Assessment Comments",
                client.details.riskAssessmentComments
              )}
              {renderDetailItem("Services Provided", client.details.services)}
              {renderDetailItem("Requests", client.requests.length)}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">
                  Attendance Allowance
                </h4>
                <div className="ml-4 space-y-1">
                  {renderDetailItem(
                    "Requested Level",
                    client.details.attendanceAllowance.requestedLevel
                  )}
                  {renderDetailItem(
                    "Requested Date",
                    client.details.attendanceAllowance.requestedDate
                  )}
                  {renderDetailItem(
                    "Status",
                    client.details.attendanceAllowance.status
                  )}
                  {renderDetailItem(
                    "Confirmation Date",
                    client.details.attendanceAllowance.confirmationDate
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="logs"
              className="p-4 border rounded-lg bg-white/80 space-y-6"
            >
              <div>
                <h4 className="text-md font-semibold mb-2 text-gray-600">
                  Packages
                </h4>
                {client.requests.flatMap((req) => req.packages).length > 0 ? (
                  <DataTable
                    data={client.requests.flatMap((req) => req.packages)}
                    columns={packageColumns}
                    title=""
                    searchPlaceholder="Search packages..."
                    resource="packages"
                  />
                ) : (
                  <p className="text-sm text-gray-500">
                    No packages found for this client.
                  </p>
                )}
              </div>
              <div>
                <h4 className="text-md font-semibold mb-2 text-gray-600">
                  MAG Logs
                </h4>
                {client.magLogs.length > 0 ? (
                  <DataTable
                    data={client.magLogs}
                    columns={magLogColumns}
                    title=""
                    searchPlaceholder="Search MAG logs..."
                    resource="mag"
                  />
                ) : (
                  <p className="text-sm text-gray-500">
                    No MAG logs found for this client.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent
              value="requests"
              className="p-4 border rounded-lg bg-white/80"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                New Requests
              </h3>
              {client.requests.length > 0 ? (
                <DataTable
                  data={client.requests}
                  columns={requestColumns}
                  title=""
                  searchPlaceholder="Search requests..."
                  resource="requests"
                />
              ) : (
                <p className="text-sm text-gray-500">
                  No new requests found for this client.
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
                  disabled={updateClientMutation.isPending}
                  size="sm"
                  className="ml-auto"
                >
                  {updateClientMutation.isPending ? "Saving..." : "Save Notes"}
                </Button>
              </div>
              <NotesEditor notes={currentNotes} onChange={setCurrentNotes} />
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter className="mt-4">
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="default" onClick={() => onEdit(client.id)}>
                Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" onClick={() => onDelete(client.id)}>
                Delete
              </Button>
            )}
          </div>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
