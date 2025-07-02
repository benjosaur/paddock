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

  // Update columns to use tRPC data
  const volunteerLogModalColumns: TableColumn<
    ClientFull["volunteerLogs"][number]
  >[] = [
    { key: "date", header: "Date" },
    {
      key: "volunteerId",
      header: "Volunteer",
      render: (item) =>
        item.volunteers.map((volunteer) => volunteer.details.name).join(", "),
    },
    { key: "hoursLogged", header: "Hours Logged" },
    { key: "notes", header: "Notes" },
  ];

  const mpLogModalColumns: TableColumn<ClientFull["mpLogs"][number]>[] = [
    { key: "date", header: "Date" },
    {
      key: "mp",
      header: "MP",
      render: (item) => item.mps.map((mp) => mp.details.name).join(", "),
    },
    {
      key: "services",
      header: "Service(s)",
      render: (item) => item.details.services.join(", "),
    },
    { key: "notes", header: "Notes" },
  ];

  const magLogModalColumns: TableColumn<ClientFull["magLogs"][number]>[] = [
    { key: "date", header: "Date" },
    { key: "total", header: "Total Attendees" },
    { key: "notes", header: "Notes" },
  ];

  const clientRequestModalColumns: TableColumn<
    ClientFull["mpRequests"][number] | ClientFull["volunteerRequests"][number]
  >[] = [
    { key: "requestType", header: "Type" },
    { key: "startDate", header: "Start Date" },
    { key: "schedule", header: "Schedule" },
    { key: "status", header: "Status" },
  ];

  if (!client) return null;

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
              {renderDetailItem("Address", client.details.address)}
              {renderDetailItem("Post Code", client.postCode)}
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
              {renderDetailItem("Needs", client.details.needs)}
              {renderDetailItem("Services Provided", client.details.services)}
              {renderDetailItem(
                "Requests",
                client.mpRequests.length + client.volunteerRequests.length
              )}
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
                  MP Logs
                </h4>
                {client.mpLogs.length > 0 ? (
                  <DataTable
                    data={client.mpLogs}
                    columns={mpLogModalColumns}
                    title=""
                    searchPlaceholder="Search MP logs..."
                    resource="mpLogs"
                  />
                ) : (
                  <p className="text-sm text-gray-500">
                    No MP logs found for this client.
                  </p>
                )}
              </div>
              <div>
                <h4 className="text-md font-semibold mb-2 text-gray-600">
                  Volunteer Logs
                </h4>
                {client.volunteerLogs.length > 0 ? (
                  <DataTable
                    data={client.volunteerLogs}
                    columns={volunteerLogModalColumns}
                    title=""
                    searchPlaceholder="Search volunteer logs..."
                    resource="volunteerLogs"
                  />
                ) : (
                  <p className="text-sm text-gray-500">
                    No Volunteer logs found for this client.
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
                    resource="magLogs"
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
              {client.mpRequests.length + client.volunteerRequests.length >
              0 ? (
                <DataTable
                  data={[...client.mpRequests, ...client.volunteerRequests]}
                  columns={clientRequestModalColumns}
                  title=""
                  searchPlaceholder="Search requests..."
                  resource="clientRequests"
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
