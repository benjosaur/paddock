import { useQuery } from "@tanstack/react-query";
import { trpc } from "../utils/trpc";
import { AnimatedCounter } from "../components/AnimatedCounter";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getCurrentYear(): { startDate: string; endDate: string } {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  return {
    startDate: formatDate(startOfYear),
    endDate: formatDate(now),
  };
}

export function Dashboard() {
  // Fetch all required data
  const clientsQuery = useQuery(trpc.clients.getAll.queryOptions());
  const mpsQuery = useQuery(trpc.mps.getAll.queryOptions());
  const volunteersQuery = useQuery(trpc.volunteers.getAll.queryOptions());
  const activePackagesQuery = useQuery(trpc.packages.getAllNotEndedYet.queryOptions());
  const analyticsQuery = useQuery(trpc.analytics.)

  // Get year to date range
  const yearRange = getCurrentYear();
  const mpLogsYearQuery = useQuery(
    trpc.mpLogs.getByDateInterval.queryOptions({
      startDate: yearRange.startDate,
      endDate: yearRange.endDate,
    })
  );

  // Get postcode specific data
  const mpLogsTA41Query = useQuery(
    trpc.mpLogs.getByPostCode.queryOptions("TA4 1")
  );
  const mpLogsTA42Query = useQuery(
    trpc.mpLogs.getByPostCode.queryOptions("TA4 2")
  );

  // Check if any queries are loading
  const isLoading =
    clientsQuery.isLoading ||
    mpsQuery.isLoading ||
    volunteersQuery.isLoading ||
    mpLogsQuery.isLoading ||
    mpLogsYearQuery.isLoading ||
    mpLogsTA41Query.isLoading ||
    mpLogsTA42Query.isLoading;

  // Check if any queries have errors
  const hasError =
    clientsQuery.error ||
    mpsQuery.error ||
    volunteersQuery.error ||
    mpLogsQuery.error ||
    mpLogsYearQuery.error ||
    mpLogsTA41Query.error ||
    mpLogsTA42Query.error;

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

  // Calculate totals
  const totalClients = clientsQuery.data?.length || 0;
  const totalMps = mpsQuery.data?.length || 0;
  const totalVolunteers = volunteersQuery.data?.length || 0;
  const totalMpLogs = mpLogsQuery.data?.length || 0;
  const totalMpLogsThisYear = mpLogsYearQuery.data?.length || 0;
  const totalMpLogsTA41 = mpLogsTA41Query.data?.length || 0;
  const totalMpLogsTA42 = mpLogsTA42Query.data?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Live Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatedCounter targetValue={totalClients} label="Total Clients" />

        <AnimatedCounter targetValue={totalMps} label="Total MPs" />

        <AnimatedCounter
          targetValue={totalVolunteers}
          label="Total Volunteers"
        />

        <AnimatedCounter
          targetValue={totalMpLogs}
          label="Total Brokered Care Hours"
        />

        <AnimatedCounter
          targetValue={totalMpLogsTA41}
          label="Care Hours Completed in TA4 1"
        />

        <AnimatedCounter
          targetValue={totalMpLogsTA42}
          label="Care Hours Completed in TA4 2"
        />

        <AnimatedCounter
          targetValue={totalMpLogsThisYear}
          label={`Care Hours Completed This Year (${new Date().getFullYear()})`}
        />
      </div>
    </div>
  );
}
