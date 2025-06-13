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
import type {
  Client,
  MpLog,
  VolunteerLog,
  MagLog,
  ClientRequest,
  TableColumn,
  Volunteer,
  Mp,
} from "../types";
import { DataTable } from "./DataTable";
import { useQuery } from "@tanstack/react-query";

interface ClientDetailModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export function ClientDetailModal({
  client,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: ClientDetailModalProps) {
  const allMpLogsQuery = useQuery(trpc.mpLogs.getAll.queryOptions());
  const allVolunteerLogsQuery = useQuery(
    trpc.volunteerLogs.getAll.queryOptions()
  );
  const allMagLogsQuery = useQuery(trpc.magLogs.getAll.queryOptions());
  const allClientRequestsQuery = useQuery(
    trpc.clientRequests.getAll.queryOptions()
  );
  const mpsQuery = useQuery(trpc.mps.getAll.queryOptions());
  const volunteersQuery = useQuery(trpc.volunteers.getAll.queryOptions());

  const allMpLogs = allMpLogsQuery.data || [];
  const clientMpLogs = allMpLogs.filter(
    (log: MpLog) => log.clientId === client.id
  );
  const allVolunteerLogs = allVolunteerLogsQuery.data || [];
  const clientVolunteerLogs = allVolunteerLogs.filter(
    (log: VolunteerLog) => log.clientId === client.id
  );
  const allMagLogs = allMagLogsQuery.data || [];
  const clientMagLogs = allMagLogs.filter((log: MagLog) =>
    log.attendees.includes(client.id)
  );
  const allClientRequests = allClientRequestsQuery.data || [];
  const clientRequests = allClientRequests.filter(
    (req: ClientRequest) => req.clientId === client.id
  );
  const mps = mpsQuery.data || [];
  const volunteers = volunteersQuery.data || [];

  // Update columns to use tRPC data
  const volunteerLogModalColumns: TableColumn<VolunteerLog>[] = [
    { key: "date", header: "Date" },
    {
      key: "volunteerId",
      header: "Volunteer",
      render: (item: VolunteerLog) =>
        volunteers.find((v: Volunteer) => v.id === item.volunteerId)?.name ||
        item.volunteerId,
    },
    { key: "activity", header: "Activity" },
    { key: "hoursLogged", header: "Hours Logged" },
    { key: "notes", header: "Notes" },
  ];

  const mpLogModalColumns: TableColumn<MpLog>[] = [
    { key: "date", header: "Date" },
    {
      key: "mp",
      header: "MP",
      render: (item: MpLog) =>
        mps.find((mp: Mp) => mp.id === item.mpId)?.name || item.mpId,
    },
    {
      key: "services",
      header: "Service(s)",
      render: (item) => item.services.join(", "),
    },
    { key: "notes", header: "Notes" },
  ];

  const magLogModalColumns: TableColumn<MagLog>[] = [
    { key: "date", header: "Date" },
    { key: "total", header: "Total Attendees" },
    { key: "notes", header: "Notes" },
  ];

  const clientRequestModalColumns: TableColumn<ClientRequest>[] = [
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
            Client Details: {client.name}
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
              {renderDetailItem("Date of Birth", client.dob)}
              {renderDetailItem("Address", client.address)}
              {renderDetailItem("Post Code", client.postCode)}
              {renderDetailItem("Phone", client.phone)}
              {renderDetailItem("Email", client.email)}
              {renderDetailItem("Next of Kin", client.nextOfKin)}
              {renderDetailItem("Referred By/On", client.referredBy)}
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
                client.clientAgreementDate
              )}
              {renderDetailItem(
                "Client Agreement Comments",
                client.clientAgreementComments
              )}
              {renderDetailItem(
                "Risk Assessment Date",
                client.riskAssessmentDate
              )}
              {renderDetailItem(
                "Risk Assessment Comments",
                client.riskAssessmentComments
              )}
              {renderDetailItem("Needs", client.needs)}
              {renderDetailItem("Services Provided", client.servicesProvided)}
              {renderDetailItem("Has MP?", client.hasMp ? "Yes" : "No")}
              {renderDetailItem(
                "Has Attendance Allowance?",
                client.hasAttendanceAllowance ? "Yes" : "No"
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
                {clientMpLogs.length > 0 ? (
                  <DataTable
                    data={clientMpLogs}
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
                {clientVolunteerLogs.length > 0 ? (
                  <DataTable
                    data={clientVolunteerLogs}
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
                {clientMagLogs.length > 0 ? (
                  <DataTable
                    data={clientMagLogs}
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
              {clientRequests.length > 0 ? (
                <DataTable
                  data={clientRequests}
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
