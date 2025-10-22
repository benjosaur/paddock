import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Button } from "../components/ui/button";
import { trpc } from "../utils/trpc";
import { formatYmdToDmy } from "@/utils/date";
import type { MpMetadata, VolunteerMetadata, TableColumn } from "../types";
import { useQuery } from "@tanstack/react-query";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

const mpPublicLiabilityColumns: TableColumn<MpMetadata>[] = [
  {
    key: "name",
    header: "Name",
    render: (item) => item.details.name,
  },
  {
    key: "publicLiabilityNumber",
    header: "Public Liability Number",
    render: (item) =>
      item.details.publicLiabilityNumber || "No Public Liability",
  },
  {
    key: "publicLiabilityExpiry",
    header: "Public Liability Expiry",
    render: (item) =>
      item.publicLiabilityExpiry
        ? formatYmdToDmy(item.publicLiabilityExpiry)
        : "No Public Liability",
  },
];

const volunteerPublicLiabilityColumns: TableColumn<VolunteerMetadata>[] =
  mpPublicLiabilityColumns;

export default function PublicLiabilityRoutes() {
  const [showArchived, setShowArchived] = useState(false);

  const mpsQuery = useQuery(
    showArchived
      ? trpc.mps.getAll.queryOptions()
      : trpc.mps.getAllNotEnded.queryOptions()
  );
  const volunteersQuery = useQuery(
    showArchived
      ? trpc.volunteers.getAll.queryOptions()
      : trpc.volunteers.getAllNotEnded.queryOptions()
  );

  const mps = mpsQuery.data || [];
  const volunteers = volunteersQuery.data || [];

  const compareByPublicLiabilityExpiry = <
    T extends { publicLiabilityExpiry?: string }
  >(
    a: T,
    b: T
  ) => {
    const aExp = a.publicLiabilityExpiry || "";
    const bExp = b.publicLiabilityExpiry || "";
    if (aExp === bExp) return 0;
    if (aExp === "") return -1;
    if (bExp === "") return 1;
    return aExp.localeCompare(bExp);
  };

  const sortedMps = [...mps].sort(compareByPublicLiabilityExpiry);
  const sortedVolunteers = [...volunteers].sort(compareByPublicLiabilityExpiry);

  if (mpsQuery.isLoading || volunteersQuery.isLoading)
    return <div>Loading...</div>;
  if (mpsQuery.error || volunteersQuery.error)
    return <div>Error loading Insurance records</div>;

  return (
    <Routes>
      <Route
        index
        element={
          <div className="space-y-6 animate-in">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Insurance Records
                </h1>
                <span className="text-sm select-none text-gray-500 bg-gray-100/60 px-3 py-1 rounded-full border border-gray-200/50">
                  Total: {mps.length + volunteers.length}
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
                  key={`mps-public-liability-${showArchived}`}
                  title="MPs"
                  searchPlaceholder="Search MPs..."
                  data={sortedMps}
                  columns={mpPublicLiabilityColumns}
                  resource="mps"
                />
              </TabsContent>

              <TabsContent value="volunteers" className="mt-6">
                <DataTable
                  key={`volunteers-public-liability-${showArchived}`}
                  title="Volunteers"
                  searchPlaceholder="Search volunteers..."
                  data={sortedVolunteers}
                  columns={volunteerPublicLiabilityColumns}
                  resource="volunteers"
                />
              </TabsContent>
            </Tabs>
          </div>
        }
      />
    </Routes>
  );
}
