import { useMemo, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { DataTable } from "../components/tables/DataTable";
import { Button } from "../components/ui/button";
import { trpc } from "../utils/trpc";
import { compareDates, formatYmdToDmy } from "@/utils/date";
import type { TableColumn } from "../types";
import type { CoreTrainingRecordCompletion } from "shared";
import { useQuery } from "@tanstack/react-query";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { TrainingRecordForm } from "../pages/TrainingRecordForm";
import { TrainingRecordDetailModal } from "@/components/modals/TrainingRecordDetailModal";

// This is a summary table. Need to go into a row to get into CRUD for individual records.

type CoreCompletionRow = CoreTrainingRecordCompletion & { id: string };

const aggregateColumns: TableColumn<CoreCompletionRow>[] = [
  {
    key: "name",
    header: "Name",
    render: (item) => item.carer.name,
  },
  {
    key: "earliest",
    header: "Earliest Expiry",
    render: (item) => formatYmdToDmy(item.earliestCoreExpiryDate || ""),
  },
  {
    key: "rate",
    header: "Core Completion Rate",
    render: (item) => `${Math.round(item.coreCompletionRate)}%`,
  },
];

export default function RecordsRoutes() {
  const [showEnded, setShowEnded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCarerId, setSelectedCarerId] = useState<string | null>(null);

  const mpRecordsQuery = useQuery(
    trpc.mps.getCoreTrainingRecordCompletions.queryOptions({
      withEnded: showEnded,
    })
  );

  const volunteerRecordsQuery = useQuery(
    trpc.volunteers.getCoreTrainingRecordCompletions.queryOptions({
      withEnded: showEnded,
    })
  );

  const mpRecords = mpRecordsQuery.data || [];
  const volunteerRecords = volunteerRecordsQuery.data || [];

  const sortedMpRecords = useMemo(
    () =>
      [...((mpRecords as CoreTrainingRecordCompletion[]) || [])].sort(
        (record1, record2) =>
          compareDates(
            record1.earliestCoreExpiryDate,
            record2.earliestCoreExpiryDate
          )
      ),
    [mpRecords]
  );
  const sortedVolunteerRecords = useMemo(
    () =>
      [...((volunteerRecords as CoreTrainingRecordCompletion[]) || [])].sort(
        (record1, record2) =>
          compareDates(
            record1.earliestCoreExpiryDate,
            record2.earliestCoreExpiryDate
          )
      ),
    [volunteerRecords]
  );

  const mpRows: CoreCompletionRow[] = useMemo(
    () =>
      sortedMpRecords.map((r) => ({
        ...r,
        id: r.carer.id,
      })),
    [sortedMpRecords]
  );
  const volunteerRows: CoreCompletionRow[] = useMemo(
    () =>
      sortedVolunteerRecords.map((r) => ({
        ...r,
        id: r.carer.id,
      })),
    [sortedVolunteerRecords]
  );

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCarerId(null);
  };

  if (mpRecordsQuery.isLoading || volunteerRecordsQuery.isLoading)
    return <div>Loading...</div>;
  if (mpRecordsQuery.error || volunteerRecordsQuery.error)
    return <div>Error loading records</div>;

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
                  variant={showEnded ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowEnded(!showEnded)}
                  className="shadow-sm"
                >
                  {showEnded ? "Hide Ended" : "Show Ended"}
                </Button>
              </div>
            </div>

            <Tabs defaultValue="mps" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mps">MPs</TabsTrigger>
                <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
              </TabsList>

              <TabsContent value="mps" className="mt-6">
                <DataTable<CoreCompletionRow>
                  key={`mps-core-completions-${showEnded}`}
                  title="MPs"
                  searchPlaceholder="Search MPs..."
                  data={mpRows}
                  columns={aggregateColumns}
                  onViewItem={(id) => {
                    const row = mpRows.find((r) => r.id === id);
                    setSelectedCarerId(row?.carer.id ?? null);
                    setIsModalOpen(!!row);
                  }}
                  resource="trainingRecords"
                />
              </TabsContent>

              <TabsContent value="volunteers" className="mt-6">
                <DataTable<CoreCompletionRow>
                  key={`volunteers-core-completions-${showEnded}`}
                  title="Volunteers"
                  searchPlaceholder="Search volunteers..."
                  data={volunteerRows}
                  columns={aggregateColumns}
                  onViewItem={(id) => {
                    const row = volunteerRows.find((r) => r.id === id);
                    setSelectedCarerId(row?.carer.id ?? null);
                    setIsModalOpen(!!row);
                  }}
                  resource="trainingRecords"
                />
              </TabsContent>
            </Tabs>
            {/* View Modal */}
            {selectedCarerId && (
              <TrainingRecordDetailModal
                carerId={selectedCarerId}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
              />
            )}
          </div>
        }
      />
    </Routes>
  );
}

export const associatedRecordRoutes: any[] = [
  trpc.mps.getAll,
  trpc.mps.getAllNotEndedYet,
  trpc.mps.getById,

  // MAG
  trpc.mag.getAll,
  trpc.mag.getById,

  // Packages
  trpc.packages.getAll,
  trpc.packages.getAllInfo,
  trpc.packages.getAllWithoutInfo,
  trpc.packages.getAllWithoutInfoNotEndedYet,
  trpc.packages.getById,

  // Requests
  trpc.requests.getAllWithoutInfoWithPackages,
  trpc.requests.getAllInfoMetadata,
  trpc.requests.getAllMetadataWithoutInfo,
  trpc.requests.getAllWithoutInfoNotEndedYetWithPackages,
  trpc.requests.getById,

  trpc.volunteers.getAll,
  trpc.volunteers.getAllNotEndedYet,
  trpc.volunteers.getById,

  // Packages
  trpc.packages.getAll,
  trpc.packages.getAllInfo,
  trpc.packages.getAllWithoutInfo,
  trpc.packages.getAllWithoutInfoNotEndedYet,
  trpc.packages.getById,

  // Requests
  trpc.requests.getAllWithoutInfoWithPackages,
  trpc.requests.getAllInfoMetadata,
  trpc.requests.getAllMetadataWithoutInfo,
  trpc.requests.getAllWithoutInfoNotEndedYetWithPackages,
  trpc.requests.getById,

  trpc.mps.getCoreTrainingRecordCompletions,
  trpc.volunteers.getCoreTrainingRecordCompletions,

  // Training records
  trpc.trainingRecords.getAll,
  trpc.trainingRecords.getAllNotEndedYet,
  trpc.trainingRecords.getById,
  trpc.trainingRecords.getByExpiringBefore,
];
