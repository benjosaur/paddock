import { useMemo, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { trpc } from "../utils/trpc";
import { formatYmdToDmy } from "@/utils/date";
import type { TrainingRecord, TableColumn } from "../types";
import type { CoreTrainingRecordCompletion } from "shared";
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
import EndDialog from "../components/EndDialog";
import type { EndTrainingRecordDetails } from "shared";

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
    render: (item) => formatYmdToDmy(item.expiryDate || ""),
  },
  {
    key: "notes",
    header: "Notes",
    render: (item) => item.details.notes,
  },
];

// Columns reused for the detail modal DataTable of individual records

type CoreCompletionRow = CoreTrainingRecordCompletion & { id: string };

const aggregateColumns: TableColumn<CoreCompletionRow>[] = [
  {
    key: "name",
    header: "Name",
    render: (item) => item.carer.name,
  },
  {
    key: "earliest",
    header: "Earliest Completion",
    render: (item) => formatYmdToDmy(item.earliestCompletionDate || ""),
  },
  {
    key: "rate",
    header: "Core Completion Rate",
    render: (item) => `${Math.round(item.coreCompletionRate)}%`,
  },
];

export default function RecordsRoutes() {
  const navigate = useNavigate();
  const [showEnded, setShowEnded] = useState(false);
  const queryClient = useQueryClient();
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [endDetails, setEndDetails] = useState<EndTrainingRecordDetails | null>(
    null
  );

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

  const recordsQueryKeys = [
    trpc.mps.getCoreTrainingRecordCompletions.queryKey(),
    trpc.volunteers.getCoreTrainingRecordCompletions.queryKey(),
  ];

  const deleteRecordMutation = useMutation(
    trpc.trainingRecords.delete.mutationOptions({
      onSuccess: () => {
        // Invalidate training records queries and related routes
        [
          ...recordsQueryKeys,
          ...associatedVolunteerRoutes,
          ...associatedMpRoutes,
        ].forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  const endRecordMutation = useMutation(
    trpc.trainingRecords.end.mutationOptions({
      onSuccess: () => {
        [
          ...recordsQueryKeys,
          ...associatedVolunteerRoutes,
          ...associatedMpRoutes,
        ].forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  const mpRecords = mpRecordsQuery.data || [];
  const volunteerRecords = volunteerRecordsQuery.data || [];

  const compareByExpiry = <T extends { earliestCompletionDate?: string }>(
    a: T,
    b: T
  ) => {
    const aExp = a.earliestCompletionDate || "";
    const bExp = b.earliestCompletionDate || "";
    if (aExp === bExp) return 0;
    if (aExp === "") return -1;
    if (bExp === "") return 1;
    return aExp.localeCompare(bExp);
  };

  const sortedMpRecords = useMemo(
    () =>
      [...((mpRecords as CoreTrainingRecordCompletion[]) || [])].sort(
        compareByExpiry
      ),
    [mpRecords]
  );
  const sortedVolunteerRecords = useMemo(
    () =>
      [...((volunteerRecords as CoreTrainingRecordCompletion[]) || [])].sort(
        compareByExpiry
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

  const handleEditRecord = (item: TrainingRecord) => {
    const encodedId = encodeURIComponent(item.id);
    const encodedOwnerId = encodeURIComponent(item.ownerId);
    navigate(`/records/edit?id=${encodedId}&ownerId=${encodedOwnerId}`);
  };

  const handleDeleteRecord = (item: TrainingRecord) => {
    deleteRecordMutation.mutate({ id: item.id, ownerId: item.ownerId });
  };

  const handleEnd = (item: TrainingRecord) => {
    // Only allow end from non-Ended view; un-end is not supported for training records
    if (item.endDate === "open") {
      setEndDetails({ ownerId: item.ownerId, recordId: item.id, endDate: "" });
      setIsEndDialogOpen(true);
    }
  };

  // Detail modal state for viewing a carer's core records
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<CoreCompletionRow | null>(
    null
  );

  const selectedCoreAsTrainingRecords: TrainingRecord[] = useMemo(() => {
    if (!selectedRow) return [];
    return selectedRow.coreRecords.map((carer) => ({
      id: carer.id,
      ownerId: carer.ownerId,
      completionDate: carer.completionDate,
      expiryDate: carer.expiryDate,
      endDate: carer.endDate,
      details: {
        name: carer.details.name,
        // cast is safe: core types are subset of full trainingRecordTypes
        recordName: carer.details
          .recordName as TrainingRecord["details"]["recordName"],
        recordNumber: carer.details.recordNumber,
        notes: carer.details.notes,
      },
    }));
  }, [selectedRow]);

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
                    const row = mpRows.find((r) => r.id === id) || null;
                    setSelectedRow(row);
                    setIsViewOpen(!!row);
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
                    const row = volunteerRows.find((r) => r.id === id) || null;
                    setSelectedRow(row);
                    setIsViewOpen(!!row);
                  }}
                  resource="trainingRecords"
                />
              </TabsContent>
            </Tabs>
            {/* Detail modal showing core records for selected person */}
            <div>
              <EndDialog
                isOpen={isEndDialogOpen}
                onOpenChange={(open) => {
                  setIsEndDialogOpen(open);
                  if (!open) setEndDetails(null);
                }}
                entityLabel="Training Record"
                endDate={endDetails?.endDate}
                onEndDateChange={(date) =>
                  setEndDetails((prev) =>
                    prev ? { ...prev, endDate: date } : prev
                  )
                }
                onConfirm={() => {
                  if (
                    !endDetails?.ownerId ||
                    !endDetails.recordId ||
                    !endDetails.endDate
                  )
                    return;
                  endRecordMutation.mutate(endDetails);
                  setIsEndDialogOpen(false);
                  setEndDetails(null);
                }}
                confirmDisabled={
                  !endDetails?.endDate ||
                  !endDetails?.ownerId ||
                  !endDetails?.recordId ||
                  endRecordMutation.isPending
                }
                endDescription="Select an end date. This will archive the training record."
                undoDescription=""
              />
            </div>
            {/* View Modal */}
            {selectedRow && (
              <div>
                {/* Reuse dialog primitives via ui/dialog */}
                <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                  <DialogContent className="max-w-5xl">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedRow.carer.name}'s Core Training Records
                      </DialogTitle>
                      <DialogDescription>
                        View and manage individual core training records.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-2">
                      <DataTable<TrainingRecord>
                        title="Core Records"
                        searchPlaceholder="Search records..."
                        data={selectedCoreAsTrainingRecords}
                        columns={trainingRecordColumns}
                        onEditRecord={handleEditRecord}
                        onDeleteRecord={handleDeleteRecord}
                        onEnd={!showEnded ? handleEnd : undefined}
                        resource="trainingRecords"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        }
      />
    </Routes>
  );
}
