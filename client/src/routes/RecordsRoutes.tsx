import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Button } from "../components/ui/button";
import { trpc } from "../utils/trpc";
import type { TrainingRecord, TableColumn } from "../types";
import { useQuery } from "@tanstack/react-query";
import { calculateTimeToDate } from "@/utils/helpers";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

const mpRecordColumns: TableColumn<TrainingRecord>[] = [
  {
    key: "personName",
    header: "Name",
    render: (item) => item.details.name,
  },
  {
    key: "recordName",
    header: "Training Record",
    render: (item) => item.details.recordName,
  },
  {
    key: "date",
    header: "Expires",
    render: (item) => calculateTimeToDate(item.expiryDate),
  },
];

const volunteerRecordColumns: TableColumn<TrainingRecord>[] = [
  {
    key: "personName",
    header: "Name",
    render: (item) => item.details.name,
  },
  {
    key: "recordName",
    header: "Training Record",
    render: (item) => item.details.recordName,
  },
  {
    key: "date",
    header: "Expires",
    render: (item) => calculateTimeToDate(item.expiryDate),
  },
];

export default function RecordsRoutes() {
  const [showArchived, setShowArchived] = useState(false);

  const recordsQuery = useQuery(
    showArchived 
      ? trpc.trainingRecords.getAll.queryOptions()
      : trpc.trainingRecords.getAllNotArchived.queryOptions()
  );

  const allRecords = recordsQuery.data || [];
  
  // Filter records by role post-fetch
  const mpRecords = allRecords.filter(record => record.ownerId.startsWith("m"));
  const volunteerRecords = allRecords.filter(record => record.ownerId.startsWith("v"));

  if (recordsQuery.isLoading) return <div>Loading...</div>;
  if (recordsQuery.error) return <div>Error loading records</div>;

  return (
    <Routes>
      <Route
        index
        element={
          <div className="space-y-6 animate-in">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Training Records
                </h1>
                <span className="text-sm select-none text-gray-500 bg-gray-100/60 px-3 py-1 rounded-full border border-gray-200/50">
                  Total: {mpRecords.length + volunteerRecords.length}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant={showArchived ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                  className="shadow-sm"
                >
                  {showArchived ? "Hide Archived" : "Show Archived"}
                </Button>
              </div>
            </div>
            
            <Tabs defaultValue="mps" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mps">MPs</TabsTrigger>
                <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
              </TabsList>

              <TabsContent value="mps" className="mt-6">
                <DataTable
                  key={`mps-records-${showArchived}`}
                  title="MPs"
                  searchPlaceholder="Search MP records..."
                  data={mpRecords}
                  columns={mpRecordColumns}
                  resource="trainingRecords"
                />
              </TabsContent>

              <TabsContent value="volunteers" className="mt-6">
                <DataTable
                  key={`volunteers-records-${showArchived}`}
                  title="Volunteers"
                  searchPlaceholder="Search volunteer records..."
                  data={volunteerRecords}
                  columns={volunteerRecordColumns}
                  resource="trainingRecords"
                />
              </TabsContent>
            </Tabs>
          </div>
        }
      />
    </Routes>
  );
}
