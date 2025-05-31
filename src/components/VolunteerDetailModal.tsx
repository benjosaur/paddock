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
  Volunteer,
  VolunteerLog,
  TableColumn,
  TrainingRecordItem,
} from "../types";
import { mockVolunteerLogs } from "../data/mockData";
import { DataTable } from "./DataTable";

interface VolunteerDetailModalProps {
  volunteer: Volunteer | null;
  isOpen: boolean;
  onClose: () => void;
}

const volunteerLogModalColumns: TableColumn<VolunteerLog>[] = [
  { key: "date", header: "Date" },
  { key: "activity", header: "Activity" },
  { key: "hoursLogged", header: "Hours Logged" },
  { key: "notes", header: "Notes" },
];

const trainingRecordModalColumns: TableColumn<TrainingRecordItem>[] = [
  { key: "training", header: "Training" },
  { key: "expiry", header: "Expiry" },
];

export function VolunteerDetailModal({
  volunteer,
  isOpen,
  onClose,
}: VolunteerDetailModalProps) {
  const [volunteerLogs, setVolunteerLogs] = useState<VolunteerLog[]>([]);

  useEffect(() => {
    if (volunteer) {
      setVolunteerLogs(
        mockVolunteerLogs.filter(
          (log: VolunteerLog) => log.volunteer === volunteer.name
        )
      );
    } else {
      setVolunteerLogs([]);
    }
  }, [volunteer]);

  if (!volunteer) return null;

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
            Volunteer Details: {volunteer.name}
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
              {renderDetailItem("ID", volunteer.id)}
              {renderDetailItem("Name", volunteer.name)}
              {renderDetailItem("Age", volunteer.age)}
              {renderDetailItem("Address", volunteer.address)}
              {renderDetailItem("Post Code", volunteer.postCode)}
              {renderDetailItem("Phone", volunteer.phone)}
              {renderDetailItem("Email", volunteer.email)}
              {renderDetailItem("Next of Kin", volunteer.nextOfKin)}
              {renderDetailItem("DBS Number", volunteer.dbsNumber)}
              {renderDetailItem("DBS Expiry", volunteer.dbsExpiry)}
            </TabsContent>

            <TabsContent
              value="offerings"
              className="p-4 border rounded-lg bg-white/80"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Offerings
              </h3>
              {renderDetailItem("Services Offered", volunteer.servicesOffered)}
              {renderDetailItem("Need Types", volunteer.needTypes)}
              {renderDetailItem("Specialisms", volunteer.specialisms)}
              {renderDetailItem("Transport", volunteer.transport)}
              {renderDetailItem("Capacity", volunteer.capacity)}
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
                  data={volunteer.trainingRecords.map((tr, index) => ({
                    ...tr,
                    id: index.toString(),
                  }))}
                  columns={trainingRecordModalColumns}
                  title=""
                  searchPlaceholder="Search training records..."
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
              {volunteerLogs.length > 0 ? (
                <DataTable
                  data={volunteerLogs}
                  columns={volunteerLogModalColumns}
                  title=""
                  searchPlaceholder="Search volunteer logs..."
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
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
