import { useQuery } from "@tanstack/react-query";
import { trpc } from "../utils/trpc";
import { AnimatedCounter } from "../components/AnimatedCounter";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/tabs";
import { Package, RequestFull } from "shared";

export function Dashboard() {
  // Fetch all required data
  const clientsQuery = useQuery(trpc.clients.getAll.queryOptions());
  const mpsQuery = useQuery(trpc.mps.getAll.queryOptions());
  const volunteersQuery = useQuery(trpc.volunteers.getAll.queryOptions());
  const activeRequestsQuery = useQuery(
    trpc.requests.getAllNotEndedYet.queryOptions()
  );
  const activePackagesQuery = useQuery(
    trpc.packages.getAllNotEndedYet.queryOptions()
  );
  const analyticsPackagesXsQuery = useQuery(
    trpc.analytics.getActivePackagesCrossSection.queryOptions()
  );
  const analyticsRequestsXsQuery = useQuery(
    trpc.analytics.getActiveRequestsCrossSection.queryOptions()
  );

  // Check if any queries are loading
  const isLoading =
    clientsQuery.isLoading ||
    mpsQuery.isLoading ||
    volunteersQuery.isLoading ||
    activeRequestsQuery.isLoading ||
    activePackagesQuery.isLoading ||
    analyticsPackagesXsQuery.isLoading ||
    analyticsRequestsXsQuery.isLoading;

  // Check if any queries have errors
  const hasError =
    clientsQuery.error ||
    mpsQuery.error ||
    volunteersQuery.error ||
    activeRequestsQuery.error ||
    activePackagesQuery.error ||
    analyticsPackagesXsQuery.error ||
    analyticsRequestsXsQuery.error;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading dashboard data...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Error loading dashboard data</p>
      </div>
    );
  }

  const findUniqueClientIds = (requests: RequestFull[]): string[] => {
    return [...new Set(requests.map((req) => req.clientId))];
  };
  const findUniqueMpIds = (packages: Package[]): string[] => {
    const uniqueCarerIds = [...new Set(packages.map((pkg) => pkg.carerId))];
    return uniqueCarerIds.filter((id) => id[0] === "m");
  };
  const findUniqueVolunteerIds = (packages: Package[]): string[] => {
    const uniqueCarerIds = [...new Set(packages.map((pkg) => pkg.carerId))];
    return uniqueCarerIds.filter((id) => id[0] === "v");
  };

  // Calculate totals
  const totalActiveClients = findUniqueClientIds(
    activeRequestsQuery.data ?? []
  ).length;
  const totalActiveMps = findUniqueMpIds(activePackagesQuery.data ?? []).length;
  const totalActiveVolunteers = findUniqueVolunteerIds(
    activePackagesQuery.data ?? []
  ).length;
  const analyticsPackages = analyticsPackagesXsQuery.data!; // throw on isloading above
  const analyticsRequests = analyticsRequestsXsQuery.data!;

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Live Overview</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Active Requests</TabsTrigger>
          <TabsTrigger value="packages">Active Packages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatedCounter
              targetValue={totalActiveClients}
              label="Total Active Clients"
            />

            <AnimatedCounter
              targetValue={totalActiveMps}
              label="Total Active MPs"
            />

            <AnimatedCounter
              targetValue={totalActiveVolunteers}
              label="Total Active Volunteers"
            />

            <AnimatedCounter
              targetValue={analyticsPackages.totalHours}
              label="Total Active Care Hours"
            />

            <AnimatedCounter
              targetValue={analyticsRequests.totalHours}
              label="Total Active Request Hours"
            />
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-700">By Locality</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {analyticsRequests.localities.map((locality) => (
                  <AnimatedCounter
                    key={`request-locality-${locality.name}`}
                    targetValue={locality.totalHours}
                    label={`${locality.name} Hours`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-700">By Service</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {analyticsRequests.services.map((service) => (
                  <AnimatedCounter
                    key={`request-service-${service.name}`}
                    targetValue={service.totalHours}
                    label={`${service.name} Hours`}
                  />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="packages" className="mt-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-700">By Locality</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {analyticsPackages.localities.map((locality) => (
                  <AnimatedCounter
                    key={`package-locality-${locality.name}`}
                    targetValue={locality.totalHours}
                    label={`${locality.name} Hours`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-700">By Service</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {analyticsPackages.services.map((service) => (
                  <AnimatedCounter
                    key={`package-service-${service.name}`}
                    targetValue={service.totalHours}
                    label={`${service.name} Hours`}
                  />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
