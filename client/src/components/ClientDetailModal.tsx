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
import type { ClientFull, TableColumn } from "../types";
import { DataTable } from "./DataTable";
import { useQuery } from "@tanstack/react-query";

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
  const clientQuery = useQuery(
    trpc.clients.getById.queryOptions({ id: clientId })
  );
  const client = clientQuery.data;

  const magLogModalColumns: TableColumn<ClientFull["magLogs"][number]>[] = [
    {
      key: "date",
      header: "Date",
      render: (item: ClientFull["magLogs"][number]) => item.date,
    },
    {
      key: "total",
      header: "Total Attendees",
      render: (item: ClientFull["magLogs"][number]) =>
        item.details.totalVolunteers +
        item.details.totalClients +
        item.details.totalFamily +
        item.details.totalMps +
        item.details.otherAttendees,
    },
    {
      key: "notes",
      header: "Notes",
      render: (item: ClientFull["magLogs"][number]) => item.details.notes,
    },
  ];

  const requestModalColumns: TableColumn<ClientFull["requests"][number]>[] = [
    {
      key: "requestType",
      header: "Type",
      render: (item: ClientFull["requests"][number]) => item.requestType,
    },
    {
      key: "startDate",
      header: "Start Date",
      render: (item: ClientFull["requests"][number]) => item.startDate,
    },
    {
      key: "status",
      header: "Status",
      render: (item: ClientFull["requests"][number]) => item.details.status,
    },
  ];

  const packageModalColumns: TableColumn<
    ClientFull["requests"][number]["packages"][number]
  >[] = [
    {
      key: "id",
      header: "Package ID",
      render: (item: ClientFull["requests"][number]["packages"][number]) =>
        item.id,
    },
    {
      key: "name",
      header: "Package Name",
      render: (item: ClientFull["requests"][number]["packages"][number]) =>
        item.details.name,
    },
    {
      key: "carerId",
      header: "Carer ID",
      render: (item: ClientFull["requests"][number]["packages"][number]) =>
        item.carerId,
    },
    {
      key: "startDate",
      header: "Start Date",
      render: (item: ClientFull["requests"][number]["packages"][number]) =>
        item.startDate,
    },
    {
      key: "endDate",
      header: "End Date",
      render: (item: ClientFull["requests"][number]["packages"][number]) =>
        item.endDate === "open" ? "Ongoing" : item.endDate,
    },
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
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="contact">Contact Info</TabsTrigger>
              <TabsTrigger value="services">Services & Needs</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="requests">New Requests</TabsTrigger>
            </TabsList>

            <TabsContent
              value="contact"
              className="p-4 border rounded-lg bg-white/80"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Contact Information
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
              {renderDetailItem(
                "Attendance Allowance?",
                client.details.attendanceAllowance
              )}
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
                    columns={packageModalColumns}
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
                    columns={magLogModalColumns}
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
                  columns={requestModalColumns}
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
