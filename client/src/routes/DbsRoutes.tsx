import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Button } from "../components/ui/button";
import { trpc } from "../utils/trpc";
import type { MpMetadata, VolunteerMetadata, TableColumn } from "../types";
import { useQuery } from "@tanstack/react-query";
import { calculateTimeToDate } from "@/utils/helpers";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

const mpDbsColumns: TableColumn<MpMetadata>[] = [
  {
    key: "name",
    header: "Name",
    render: (item) => item.details.name,
  },
  {
    key: "carerId",
    header: "Carer ID",
    render: (item) => item.id,
  },
  {
    key: "dbsExpiry",
    header: "DBS Expires",
    render: (item) =>
      item.dbsExpiry ? calculateTimeToDate(item.dbsExpiry) : "No DBS",
  },
];

const volunteerDbsColumns: TableColumn<VolunteerMetadata>[] = [
  {
    key: "name",
    header: "Name",
    render: (item) => item.details.name,
  },
  {
    key: "carerId",
    header: "Carer ID",
    render: (item) => item.id,
  },
  {
    key: "dbsExpiry",
    header: "DBS Expires",
    render: (item) =>
      item.dbsExpiry ? calculateTimeToDate(item.dbsExpiry) : "No DBS",
  },
];

export default function DbsRoutes() {
  const [showArchived, setShowArchived] = useState(false);

  const mpsQuery = useQuery(
    showArchived 
      ? trpc.mps.getAll.queryOptions()
      : trpc.mps.getAllNotArchived.queryOptions()
  );
  const volunteersQuery = useQuery(
    showArchived 
      ? trpc.volunteers.getAll.queryOptions()
      : trpc.volunteers.getAllNotArchived.queryOptions()
  );

  const mps = mpsQuery.data || [];
  const volunteers = volunteersQuery.data || [];

  if (mpsQuery.isLoading || volunteersQuery.isLoading)
    return <div>Loading...</div>;
  if (mpsQuery.error || volunteersQuery.error)
    return <div>Error loading DBS records</div>;

  return (
    <Routes>
      <Route
        index
        element={
          <div className="space-y-6 animate-in">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  DBS Records
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
                  key={`mps-dbs-${showArchived}`}
                  title="MPs"
                  searchPlaceholder="Search MPs..."
                  data={mps}
                  columns={mpDbsColumns}
                  resource="mps"
                />
              </TabsContent>

              <TabsContent value="volunteers" className="mt-6">
                <DataTable
                  key={`volunteers-dbs-${showArchived}`}
                  title="Volunteers"
                  searchPlaceholder="Search volunteers..."
                  data={volunteers}
                  columns={volunteerDbsColumns}
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
