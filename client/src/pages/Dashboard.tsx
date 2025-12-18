import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Select, { SingleValue } from "react-select";
import { trpc } from "../utils/trpc";
import { AnimatedCounter } from "../components/AnimatedCounter";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/tabs";
import { Package } from "shared";
import type {
  Report,
  DeprivationReport,
  RequestMetadata,
  AttendanceAllowanceReport,
} from "shared";
import { firstYear } from "shared/const";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<
    | "requests"
    | "packages"
    | "attendance"
    | "coordinator-packages"
    | "coordinator-attendance"
  >("requests");
  const [breakdownType, setBreakdownType] = useState<
    "locality" | "deprivation"
  >("locality");
  const [startYear, setStartYear] = useState<number>(new Date().getFullYear());
  const [isInfo, setIsInfo] = useState<boolean>(false);
  const [generatedReport, setGeneratedReport] = useState<
    Report | DeprivationReport | AttendanceAllowanceReport | null
  >(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Fetch all required data
  // "Active" refers to currently ongoing requests/packages NOT archived
  const clientsQuery = useQuery(trpc.clients.getAllNotEndedYet.queryOptions());
  const mpsQuery = useQuery(trpc.mps.getAllNotEndedYet.queryOptions());
  const volunteersQuery = useQuery(
    trpc.volunteers.getAllNotEndedYet.queryOptions()
  );
  const activeRequestsQuery = useQuery(
    trpc.requests.getAllMetadataWithoutInfoNotEndedYet.queryOptions()
  );
  const activePackagesQuery = useQuery(
    trpc.packages.getAllWithoutInfoNotEndedYet.queryOptions()
  );
  const analyticsPackagesXsQuery = useQuery(
    trpc.analytics.getActivePackagesCrossSection.queryOptions()
  );
  const analyticsRequestsXsQuery = useQuery(
    trpc.analytics.getActiveRequestsCrossSection.queryOptions()
  );
  const analyticsRequestsDeprivationXsQuery = useQuery(
    trpc.analytics.getActiveRequestsDeprivationCrossSection.queryOptions()
  );
  const analyticsPackagesDeprivationXsQuery = useQuery(
    trpc.analytics.getActivePackagesDeprivationCrossSection.queryOptions()
  );

  const attendanceAllowanceQuery = useQuery(
    trpc.analytics.generateAttendanceAllowanceCrossSection.queryOptions()
  );

  const requestsReportQuery = useQuery({
    ...trpc.analytics.getRequestsReport.queryOptions({ startYear, isInfo }),
    enabled: false, // Don't auto-fetch, only when user requests it
  });

  const packagesReportQuery = useQuery({
    ...trpc.analytics.getPackagesReport.queryOptions({ startYear }),
    enabled: false, // Don't auto-fetch, only when user requests it
  });

  const requestsDeprivationReportQuery = useQuery({
    ...trpc.analytics.getRequestsDeprivationReport.queryOptions({
      startYear,
      isInfo,
    }),
    enabled: false, // Don't auto-fetch, only when user requests it
  });

  const packagesDeprivationReportQuery = useQuery({
    ...trpc.analytics.getPackagesDeprivationReport.queryOptions({ startYear }),
    enabled: false, // Don't auto-fetch, only when user requests it
  });

  const coordinatorPackagesReportQuery = useQuery({
    ...trpc.analytics.generateCoordinatorPackagesReport.queryOptions({
      startYear,
    }),
    enabled: false,
  });

  const coordinatorAttendanceReportQuery = useQuery({
    ...trpc.analytics.generateCoordinatorAttendanceReport.queryOptions({
      startYear,
    }),
    enabled: false,
  });

  const attendanceAllowanceReportQuery = useQuery({
    ...trpc.analytics.generateAttendanceAllowanceReport.queryOptions({
      startYear,
    }),
    enabled: false,
  });

  // Check if any queries are loading
  const isLoading =
    clientsQuery.isLoading ||
    mpsQuery.isLoading ||
    volunteersQuery.isLoading ||
    activeRequestsQuery.isLoading ||
    activePackagesQuery.isLoading ||
    analyticsPackagesXsQuery.isLoading ||
    analyticsRequestsXsQuery.isLoading ||
    analyticsRequestsDeprivationXsQuery.isLoading ||
    analyticsPackagesDeprivationXsQuery.isLoading ||
    attendanceAllowanceQuery.isLoading;

  // Check if any queries have errors
  const hasError =
    clientsQuery.error ||
    mpsQuery.error ||
    volunteersQuery.error ||
    activeRequestsQuery.error ||
    activePackagesQuery.error ||
    analyticsPackagesXsQuery.error ||
    analyticsRequestsXsQuery.error ||
    analyticsRequestsDeprivationXsQuery.error ||
    analyticsPackagesDeprivationXsQuery.error ||
    attendanceAllowanceQuery.error;

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

  const findUniqueClientIds = (requests: RequestMetadata[]): string[] => {
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
  const analyticsRequestsDeprivation =
    analyticsRequestsDeprivationXsQuery.data!;
  const analyticsPackagesDeprivation =
    analyticsPackagesDeprivationXsQuery.data!;
  const attendanceAllowanceData = attendanceAllowanceQuery.data!;

  // Helper function to calculate percentage
  const calculatePercentage = (part: number, total: number): number => {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  };

  const reportTypeOptions = [
    { value: "requests", label: "Requests Report" },
    { value: "packages", label: "Packages Report" },
    { value: "attendance", label: "Attendance Allowance Report" },
    { value: "coordinator-packages", label: "Coordinator Packages Report" },
    {
      value: "coordinator-attendance",
      label: "Coordinator Attendance Allowance Report",
    },
  ];

  const breakdownTypeOptions = [
    { value: "locality", label: "By Locality" },
    { value: "deprivation", label: "By Deprivation" },
  ];

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      let report: Report | DeprivationReport | AttendanceAllowanceReport;
      if (reportType === "coordinator-packages") {
        const result = await coordinatorPackagesReportQuery.refetch();
        report = result.data!;
      } else if (reportType === "coordinator-attendance") {
        const result = await coordinatorAttendanceReportQuery.refetch();
        report = result.data!;
      } else if (reportType === "attendance") {
        const result = await attendanceAllowanceReportQuery.refetch();
        report = result.data!;
      } else if (breakdownType === "locality") {
        if (reportType === "requests") {
          const result = await requestsReportQuery.refetch();
          report = result.data!;
        } else {
          const result = await packagesReportQuery.refetch();
          report = result.data!;
        }
      } else {
        // deprivation breakdown
        if (reportType === "requests") {
          const result = await requestsDeprivationReportQuery.refetch();
          report = result.data!;
        } else {
          const result = await packagesDeprivationReportQuery.refetch();
          report = result.data!;
        }
      }
      setGeneratedReport(report);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleResetReport = () => {
    setGeneratedReport(null);
  };

  const getBreakdownDisplayName = () => {
    return breakdownType === "locality" ? "Locality" : "Deprivation Category";
  };

  const getBreakdownItems = (yearData: any) => {
    return breakdownType === "locality"
      ? yearData.localities
      : yearData.deprivationCategories;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Live Overview</p>
          </div>
          <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg">
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent
              className={cn(
                "max-w-4xl max-h-[90vh]",
                generatedReport && "overflow-y-auto"
              )}
            >
              <DialogHeader>
                <DialogTitle>Generate Analytics Report</DialogTitle>
              </DialogHeader>

              {!generatedReport ? (
                <div className="space-y-6 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Report Type *
                      </label>
                      <Select
                        options={reportTypeOptions}
                        value={
                          reportTypeOptions.find(
                            (option) => option.value === reportType
                          ) || null
                        }
                        onChange={(
                          selectedOption: SingleValue<{
                            value: string;
                            label: string;
                          }>
                        ) => {
                          if (selectedOption) {
                            const newType = selectedOption.value as
                              | "requests"
                              | "packages"
                              | "attendance"
                              | "coordinator-packages"
                              | "coordinator-attendance";
                            setReportType(newType);
                            if (
                              newType === "attendance" ||
                              newType === "coordinator-packages" ||
                              newType === "coordinator-attendance"
                            ) {
                              setBreakdownType("locality");
                            }
                          }
                        }}
                        placeholder="Select report type..."
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Breakdown Type *
                      </label>
                      <Select
                        options={breakdownTypeOptions}
                        value={
                          breakdownTypeOptions.find(
                            (option) => option.value === breakdownType
                          ) || null
                        }
                        isDisabled={
                          reportType === "attendance" ||
                          reportType === "coordinator-packages" ||
                          reportType === "coordinator-attendance"
                        }
                        onChange={(
                          selectedOption: SingleValue<{
                            value: string;
                            label: string;
                          }>
                        ) => {
                          if (selectedOption) {
                            setBreakdownType(
                              selectedOption.value as "locality" | "deprivation"
                            );
                          }
                        }}
                        placeholder="Select breakdown type..."
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                      {reportType === "requests" && (
                        <div className="flex items-center space-x-2 mt-6">
                          <input
                            id="isInfo"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={isInfo}
                            onChange={(e) => setIsInfo(e.target.checked)}
                          />
                          <label
                            htmlFor="isInfo"
                            className="text-sm font-medium text-gray-700"
                          >
                            Information Service Only
                          </label>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Year
                      </label>
                      <Input
                        type="number"
                        min={firstYear}
                        max={new Date().getFullYear()}
                        value={startYear}
                        onChange={(e) =>
                          setStartYear(
                            parseInt(e.target.value) || new Date().getFullYear()
                          )
                        }
                        placeholder="e.g., 2024"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setReportModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleGenerateReport}
                      disabled={isGeneratingReport}
                    >
                      {isGeneratingReport ? "Generating..." : "Generate Report"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {reportType === "requests"
                          ? "Requests"
                          : reportType === "packages"
                          ? "Packages"
                          : reportType === "attendance"
                          ? "Attendance Allowance"
                          : reportType === "coordinator-packages"
                          ? "Coordinator Packages"
                          : "Coordinator Attendance Allowance"}{" "}
                        Analytics Report
                        {startYear &&
                          ` (${startYear} - ${new Date().getFullYear()})`}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {reportType === "coordinator-packages"
                          ? "Comprehensive breakdown by year, month, locality, and service type"
                          : reportType === "coordinator-attendance" ||
                            reportType === "attendance"
                          ? "Yearly and monthly confirmation metrics with level breakdown"
                          : `Comprehensive breakdown by year, month, ${getBreakdownDisplayName().toLowerCase()}, and service type`}
                      </p>
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" onClick={handleResetReport}>
                        Generate New Report
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setReportModalOpen(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>

                  {reportType === "attendance" ||
                  reportType === "coordinator-attendance" ? (
                    <div className="space-y-6">
                      {(generatedReport as AttendanceAllowanceReport).years.map(
                        (year) => (
                          <div
                            key={year.year}
                            className="bg-white rounded-lg border p-6"
                          >
                            <h4 className="text-xl font-semibold mb-4 text-blue-600">
                              {year.year} Summary
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              <div className="bg-gray-50 p-4 rounded">
                                <h5 className="text-lg font-medium mb-3 text-gray-700">
                                  Confirmations
                                </h5>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between bg-white px-2 py-1 rounded">
                                    <span>Total Confirmed</span>
                                    <span className="font-semibold">
                                      {year.total}
                                    </span>
                                  </div>
                                  <div className="flex justify-between bg-white px-2 py-1 rounded">
                                    <span>High Level</span>
                                    <span className="font-semibold">
                                      {year.totalHigh}
                                    </span>
                                  </div>
                                  <div className="flex justify-between bg-white px-2 py-1 rounded">
                                    <span>Requested High</span>
                                    <span className="font-semibold">
                                      {year.totalRequestedHigh}
                                    </span>
                                  </div>
                                  <div className="flex justify-between bg-white px-2 py-1 rounded">
                                    <span>High & Requested High</span>
                                    <span className="font-semibold">
                                      {year.totalHighRequestedHigh}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-gray-50 p-4 rounded">
                                <h5 className="text-lg font-medium mb-3 text-gray-700">
                                  Time Spent
                                </h5>
                                <div className="flex justify-between bg-white px-2 py-3 rounded text-sm">
                                  <span>Total Hours</span>
                                  <span className="text-blue-600 font-semibold">
                                    {year.totalHours.toFixed(2)}h
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h5 className="text-lg font-medium mb-4 text-gray-700">
                                Monthly Breakdown
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {year.months.map((month) => {
                                  const monthNames = [
                                    "January",
                                    "February",
                                    "March",
                                    "April",
                                    "May",
                                    "June",
                                    "July",
                                    "August",
                                    "September",
                                    "October",
                                    "November",
                                    "December",
                                  ];
                                  return (
                                    <div
                                      key={`${year.year}-${month.month}`}
                                      className="bg-blue-50 border border-blue-200 p-4 rounded-lg"
                                    >
                                      <div className="mb-3">
                                        <h6 className="font-semibold text-blue-800 text-base">
                                          {monthNames[month.month - 1]}{" "}
                                          {year.year}
                                        </h6>
                                        <p className="text-sm text-blue-600">
                                          Total Hours:{" "}
                                          {month.totalHours.toFixed(2)}h
                                        </p>
                                      </div>
                                      <div className="space-y-1 text-sm">
                                        <div className="flex justify-between bg-white px-2 py-1 rounded">
                                          <span>Total Confirmed</span>
                                          <span className="font-medium">
                                            {month.total}
                                          </span>
                                        </div>
                                        <div className="flex justify-between bg-white px-2 py-1 rounded">
                                          <span>High Level</span>
                                          <span className="font-medium">
                                            {month.totalHigh}
                                          </span>
                                        </div>
                                        <div className="flex justify-between bg-white px-2 py-1 rounded">
                                          <span>Requested High</span>
                                          <span className="font-medium">
                                            {month.totalRequestedHigh}
                                          </span>
                                        </div>
                                        <div className="flex justify-between bg-white px-2 py-1 rounded">
                                          <span>High & Requested High</span>
                                          <span className="font-medium">
                                            {month.totalHighRequestedHigh}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {generatedReport.years.map((year: any) => (
                        <div
                          key={year.year}
                          className="bg-white rounded-lg border p-6"
                        >
                          <h4 className="text-xl font-semibold mb-4 text-blue-600">
                            {year.year} Annual Summary - Total Hours:{" "}
                            {year.totalHours.toFixed(2)}h
                          </h4>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div>
                              <h5 className="text-lg font-medium mb-3 text-gray-700">
                                Annual {getBreakdownDisplayName()} Breakdown
                              </h5>
                              <div className="space-y-2">
                                {getBreakdownItems(year).map((item: any) => (
                                  <div
                                    key={item.name}
                                    className="bg-gray-50 p-3 rounded"
                                  >
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="font-medium">
                                        {item.name}
                                      </span>
                                      <span className="text-blue-600 font-semibold">
                                        {item.totalHours.toFixed(2)}h
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-600 mb-2">
                                      Service distribution for {item.name}:
                                    </div>
                                    <div className="grid grid-cols-1 gap-1 text-sm">
                                      {item.services.map((service: any) => (
                                        <div
                                          key={service.name}
                                          className="flex justify-between bg-white px-2 py-1 rounded"
                                        >
                                          <span>{service.name}</span>
                                          <span className="font-medium">
                                            {service.totalHours.toFixed(2)}h
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h5 className="text-lg font-medium mb-3 text-gray-700">
                                Annual Service Summary
                              </h5>
                              <div className="space-y-2">
                                {year.services.map((service: any) => (
                                  <div
                                    key={service.name}
                                    className="bg-gray-50 p-3 rounded flex justify-between items-center"
                                  >
                                    <div>
                                      <span className="font-medium block">
                                        {service.name}
                                      </span>
                                      <span className="text-xs text-gray-600">
                                        Total across all localities
                                      </span>
                                    </div>
                                    <span className="text-blue-600 font-semibold">
                                      {service.totalHours.toFixed(2)}h
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div>
                            <h5 className="text-lg font-medium mb-4 text-gray-700">
                              Detailed Monthly Analysis
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {year.months.map((month: any) => {
                                const monthNames = [
                                  "January",
                                  "February",
                                  "March",
                                  "April",
                                  "May",
                                  "June",
                                  "July",
                                  "August",
                                  "September",
                                  "October",
                                  "November",
                                  "December",
                                ];
                                return (
                                  <div
                                    key={month.month}
                                    className="bg-blue-50 border border-blue-200 p-4 rounded-lg"
                                  >
                                    <div className="mb-3">
                                      <h6 className="font-semibold text-blue-800 text-base">
                                        {monthNames[month.month - 1]}{" "}
                                        {year.year}
                                      </h6>
                                      <p className="text-sm text-blue-600">
                                        Total Hours:{" "}
                                        {month.totalHours.toFixed(2)}h
                                      </p>
                                    </div>

                                    {/* Monthly Service Breakdown */}
                                    <div className="mb-4">
                                      <h6 className="text-sm font-medium text-gray-700 block mb-2">
                                        Service Distribution:
                                      </h6>
                                      <div className="space-y-1">
                                        {month.services.map((service: any) => (
                                          <div
                                            key={service.name}
                                            className="flex justify-between bg-white px-2 py-1 rounded text-sm"
                                          >
                                            <span>{service.name}</span>
                                            <span className="font-medium">
                                              {service.totalHours.toFixed(2)}h
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Monthly Breakdown with Services */}
                                    <div>
                                      <h6 className="text-sm font-medium text-gray-700 block mb-2">
                                        {getBreakdownDisplayName()} Breakdown:
                                      </h6>
                                      <div className="space-y-2">
                                        {getBreakdownItems(month).map(
                                          (item: any) => (
                                            <div
                                              key={item.name}
                                              className="bg-white p-2 rounded border"
                                            >
                                              <div className="flex justify-between items-center mb-1">
                                                <span className="font-medium text-sm">
                                                  {item.name}
                                                </span>
                                                <span className="text-blue-600 font-semibold text-sm">
                                                  {item.totalHours.toFixed(2)}h
                                                </span>
                                              </div>
                                              <div className="space-y-1">
                                                {item.services.map(
                                                  (service: any) => (
                                                    <div
                                                      key={service.name}
                                                      className="flex justify-between text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded"
                                                    >
                                                      <span>
                                                        {service.name}
                                                      </span>
                                                      <span>
                                                        {service.totalHours.toFixed(
                                                          2
                                                        )}
                                                        h
                                                      </span>
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Requests Breakdown</TabsTrigger>
          <TabsTrigger value="packages">Packages Breakdown</TabsTrigger>
          <TabsTrigger value="attendance-allowance">
            Attendance Allowance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatedCounter
              targetValue={totalActiveClients}
              label="Clients with Active Requests"
            />

            <AnimatedCounter
              targetValue={totalActiveMps}
              label="MPs with Active Packages"
            />

            <AnimatedCounter
              targetValue={totalActiveVolunteers}
              label="Volunteers with Active Packages"
            />

            <AnimatedCounter
              targetValue={analyticsRequests.totalHours}
              label="Current Requested Weekly Care Hours"
            />

            <AnimatedCounter
              targetValue={analyticsPackages.totalHours}
              label="Current Brokered Weekly Care Hours"
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
              <h3 className="text-lg font-medium text-gray-700">
                By Deprivation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {analyticsRequestsDeprivation.deprivationCategories.map((d) => (
                  <AnimatedCounter
                    key={`request-deprivation-${d.name}`}
                    targetValue={d.totalHours}
                    label={`${d.name} Hours`}
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
              <h3 className="text-lg font-medium text-gray-700">
                By Deprivation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {analyticsPackagesDeprivation.deprivationCategories.map((d) => (
                  <AnimatedCounter
                    key={`package-deprivation-${d.name}`}
                    targetValue={d.totalHours}
                    label={`${d.name} Hours`}
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

        <TabsContent value="attendance-allowance" className="mt-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-700">
                Overall In Receipt
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatedCounter
                  targetValue={attendanceAllowanceData.overallInReceipt.total}
                  label="Total Clients"
                />
                <AnimatedCounter
                  targetValue={calculatePercentage(
                    attendanceAllowanceData.overallInReceipt.totalHigh,
                    attendanceAllowanceData.overallInReceipt.total
                  )}
                  label="% High"
                />
                <AnimatedCounter
                  targetValue={calculatePercentage(
                    attendanceAllowanceData.overallInReceipt.totalRequestedHigh,
                    attendanceAllowanceData.overallInReceipt.total
                  )}
                  label="% Requested High"
                />
                <AnimatedCounter
                  targetValue={calculatePercentage(
                    attendanceAllowanceData.overallInReceipt
                      .totalHighRequestedHigh,
                    attendanceAllowanceData.overallInReceipt.total
                  )}
                  label="% High & Requested High"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-700">
                Confirmed This Month
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatedCounter
                  targetValue={attendanceAllowanceData.thisMonthConfirmed.total}
                  label="Total Clients"
                />
                <AnimatedCounter
                  targetValue={calculatePercentage(
                    attendanceAllowanceData.thisMonthConfirmed.totalHigh,
                    attendanceAllowanceData.thisMonthConfirmed.total
                  )}
                  label="% High"
                />
                <AnimatedCounter
                  targetValue={calculatePercentage(
                    attendanceAllowanceData.thisMonthConfirmed
                      .totalRequestedHigh,
                    attendanceAllowanceData.thisMonthConfirmed.total
                  )}
                  label="% Requested High"
                />
                <AnimatedCounter
                  targetValue={calculatePercentage(
                    attendanceAllowanceData.thisMonthConfirmed
                      .totalHighRequestedHigh,
                    attendanceAllowanceData.thisMonthConfirmed.total
                  )}
                  label="% High & Requested High"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
