import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import type {
  Mp,
  MpLog,
  TableColumn,
  TrainingRecordItem,
  Client,
} from "../types";
import { mockMpLogs, mockClients } from "../data/mockData";
import { DataTable } from "./DataTable";

interface MpDetailModalProps {
  mp: Mp | null;
  isOpen: boolean;
  onClose: () => void;
}

const mpLogModalColumns: TableColumn<MpLog>[] = [
  { key: "date", header: "Date" },
  {
    key: "clientId",
    header: "Client",
    render: (item: MpLog) =>
      mockClients.find((c: Client) => c.id === item.clientId)?.name ||
      item.clientId,
  },
  {
    key: "services",
    header: "Service(s)",
    render: (item) => item.services.join(", "),
  },
  { key: "notes", header: "Notes" },
];

const trainingRecordModalColumns: TableColumn<TrainingRecordItem>[] = [
  { key: "training", header: "Training" },
  { key: "expiry", header: "Expiry" },
];

export function MpDetailModal({ mp, isOpen, onClose }: MpDetailModalProps) {
  const [mpLogs, setMpLogs] = useState<MpLog[]>([]);

  useEffect(() => {
    if (mp) {
      setMpLogs(mockMpLogs.filter((log: MpLog) => log.mpId === mp.id));
    } else {
      setMpLogs([]);
    }
  }, [mp]);

  if (!mp) return null;

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
            MP Details: {mp.name}
          </DialogTitle>
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
              {renderDetailItem("Name", mp.name)}
              {renderDetailItem("Address", mp.address)}
              {renderDetailItem("Post Code", mp.postCode)}
              {renderDetailItem("Phone", mp.phone)}
              {renderDetailItem("Email", mp.email)}
              {renderDetailItem("Next of Kin", mp.nextOfKin)}
              {renderDetailItem("DBS Number", mp.dbsNumber)}
              {renderDetailItem("DBS Expiry", mp.dbsExpiry)}
              {renderDetailItem("Date of Birth", mp.dob)}
            </TabsContent>

            <TabsContent
              value="offerings"
              className="p-4 border rounded-lg bg-white/80"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Offerings
              </h3>
              {renderDetailItem("Services Offered", mp.servicesOffered)}
              {renderDetailItem("Specialisms", mp.specialisms)}
              {renderDetailItem("Transport", mp.transport)}
              {renderDetailItem("Capacity", mp.capacity)}
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
                  data={mp.trainingRecords.map((tr, index) => ({
                    ...tr,
                    id: index.toString(),
                  }))}
                  columns={trainingRecordModalColumns}
                  title=""
                  searchPlaceholder="Search training records..."
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
              {mpLogs.length > 0 ? (
                <DataTable
                  data={mpLogs}
                  columns={mpLogModalColumns}
                  title=""
                  searchPlaceholder="Search MP logs..."
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
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
