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

const mpPublicLiabilityColumns: TableColumn<MpMetadata>[] = [
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
    key: "publicLiabilityExpiry",
    header: "Public Liability Expires",
    render: (item) =>
      item.publicLiabilityExpiry
        ? calculateTimeToDate(item.publicLiabilityExpiry)
        : "No Public Liability",
  },
];

const volunteerPublicLiabilityColumns: TableColumn<VolunteerMetadata>[] = [
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
    key: "publicLiabilityExpiry",
    header: "Public Liability Expires",
    render: (item) =>
      item.publicLiabilityExpiry
        ? calculateTimeToDate(item.publicLiabilityExpiry)
        : "No Public Liability",
  },
];

export default function PublicLiabilityRoutes() {
  const mpsQuery = useQuery(trpc.mps.getAllNotArchived.queryOptions());
  const volunteersQuery = useQuery(
    trpc.volunteers.getAllNotArchived.queryOptions()
  );

  const mps = mpsQuery.data || [];
  const volunteers = volunteersQuery.data || [];

  if (mpsQuery.isLoading || volunteersQuery.isLoading)
    return <div>Loading...</div>;
  if (mpsQuery.error || volunteersQuery.error)
    return <div>Error loading Public Liability records</div>;

  return (
    <Routes>
      <Route
        index
        element={
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Public Liability Records</h1>
            <Tabs defaultValue="mps" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mps">MPs</TabsTrigger>
                <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
              </TabsList>

              <TabsContent value="mps" className="mt-6">
                <DataTable
                  key="mps-public-liability"
                  title="MP Public Liability Records"
                  searchPlaceholder="Search MPs..."
                  data={mps}
                  columns={mpPublicLiabilityColumns}
                  resource="mps"
                />
              </TabsContent>

              <TabsContent value="volunteers" className="mt-6">
                <DataTable
                  key="volunteers-public-liability"
                  title="Volunteer Public Liability Records"
                  searchPlaceholder="Search volunteers..."
                  data={volunteers}
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
