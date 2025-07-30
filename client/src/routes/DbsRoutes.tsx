import { Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
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
  const mpsQuery = useQuery(trpc.mps.getAllNotArchived.queryOptions());
  const volunteersQuery = useQuery(
    trpc.volunteers.getAllNotArchived.queryOptions()
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
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">DBS Records</h1>
            <Tabs defaultValue="mps" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mps">MPs</TabsTrigger>
                <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
              </TabsList>

              <TabsContent value="mps" className="mt-6">
                <DataTable
                  key="mps-dbs"
                  title="MPs"
                  searchPlaceholder="Search MPs..."
                  data={mps}
                  columns={mpDbsColumns}
                  resource="mps"
                />
              </TabsContent>

              <TabsContent value="volunteers" className="mt-6">
                <DataTable
                  key="volunteers-dbs"
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
