import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Button } from "../components/ui/button";
import { trpc } from "../utils/trpc";
import type { TrainingRecord, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { TrainingRecordForm } from "../pages/TrainingRecordForm";
import { associatedVolunteerRoutes } from "./VolunteersRoutes";
import { associatedMpRoutes } from "./MpsRoutes";

export const trainingRecordColumns: TableColumn<TrainingRecord>[] = [
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
    key: "recordNumber",
    header: "Training Record Number",
    render: (item) => item.details.recordNumber,
  },
  {
    key: "date",
    header: "Expiry Date",
    render: (item) => item.expiryDate,
  },
  {
    key: "notes",
    header: "Notes",
    render: (item) => item.details.notes,
  },
];

const mpRecordColumns = trainingRecordColumns;
const volunteerRecordColumns = trainingRecordColumns;

export default function RecordsRoutes() {
  const navigate = useNavigate();
  const [showArchived, setShowArchived] = useState(false);
  const queryClient = useQueryClient();

  const recordsQuery = useQuery(
    showArchived
      ? trpc.trainingRecords.getAll.queryOptions()
      : trpc.trainingRecords.getAllNotEnded.queryOptions()
  );

  const recordsQueryKey = showArchived
    ? trpc.trainingRecords.getAll.queryKey()
    : trpc.trainingRecords.getAllNotEnded.queryKey();

  const deleteRecordMutation = useMutation(
    trpc.trainingRecords.delete.mutationOptions({
      onSuccess: () => {
        // Invalidate training records queries and related routes
        queryClient.invalidateQueries({ queryKey: recordsQueryKey });
        [...associatedVolunteerRoutes, ...associatedMpRoutes].forEach(
          (route) => {
            queryClient.invalidateQueries({ queryKey: route.queryKey() });
          }
        );
      },
    })
  );

  const allRecords = recordsQuery.data || [];

  // Filter records by role post-fetch
  const mpRecords = allRecords.filter((record) =>
    record.ownerId.startsWith("m")
  );
  const volunteerRecords = allRecords.filter((record) =>
    record.ownerId.startsWith("v")
  );

  const handleEditRecord = (item: TrainingRecord) => {
    const encodedId = encodeURIComponent(item.id);
    const encodedOwnerId = encodeURIComponent(item.ownerId);
    navigate(`/records/edit?id=${encodedId}&ownerId=${encodedOwnerId}`);
  };

  const handleDeleteRecord = (item: TrainingRecord) => {
    deleteRecordMutation.mutate({ id: item.id, ownerId: item.ownerId });
  };

  if (recordsQuery.isLoading) return <div>Loading...</div>;
  if (recordsQuery.error) return <div>Error loading records</div>;

  return (
    <Routes>
      <Route path="create" element={<TrainingRecordForm />} />
      <Route path="edit" element={<TrainingRecordForm />} />
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
                  onEditRecord={handleEditRecord}
                  onDeleteRecord={handleDeleteRecord}
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
                  onEditRecord={handleEditRecord}
                  onDeleteRecord={handleDeleteRecord}
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
