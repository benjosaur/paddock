import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "../utils/trpc";
import type {
  CrossSection,
  DeprivationCrossSection,
  AttendanceAllowanceCrossSection,
} from "shared";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const chartBaseOptions: Highcharts.Options = {
  credits: { enabled: false },
  accessibility: { enabled: false },
  chart: {
    style: { fontFamily: "inherit" },
    backgroundColor: "transparent",
  },
  title: {
    style: { fontSize: "14px", fontWeight: "600", color: "#111827" },
    align: "left",
  },
  subtitle: {
    style: { fontSize: "12px", color: "#6b7280" },
    align: "left",
  },
  legend: {
    itemStyle: { fontSize: "12px", fontWeight: "500", color: "#374151" },
  },
  tooltip: {
    borderRadius: 8,
    shadow: true,
    style: { fontSize: "12px" },
  },
  plotOptions: {
    series: {
      animation: { duration: 600 },
    },
  },
};

interface Props {
  analyticsRequests: CrossSection;
  analyticsPackages: CrossSection;
  analyticsRequestsDeprivation: DeprivationCrossSection;
  analyticsPackagesDeprivation: DeprivationCrossSection;
  attendanceAllowance: AttendanceAllowanceCrossSection;
}

export function DashboardCharts({
  analyticsRequests,
  analyticsPackages,
  analyticsRequestsDeprivation,
  analyticsPackagesDeprivation,
  attendanceAllowance,
}: Props) {
  const trendStartYear = new Date().getFullYear() - 1;

  const packagesReportQuery = useQuery(
    trpc.analytics.getPackagesReport.queryOptions({ startYear: trendStartYear })
  );
  const requestsReportQuery = useQuery(
    trpc.analytics.getRequestsReport.queryOptions({
      startYear: trendStartYear,
      isInfo: false,
    })
  );

  // ── Chart 1: Care Hours Gap by Locality ───────────────────────────────────
  const allLocalityNames = [
    ...new Set([
      ...analyticsRequests.localities.map((l) => l.name),
      ...analyticsPackages.localities.map((l) => l.name),
    ]),
  ].filter((name) => {
    const req =
      analyticsRequests.localities.find((l) => l.name === name)?.totalHours ??
      0;
    const pkg =
      analyticsPackages.localities.find((l) => l.name === name)?.totalHours ??
      0;
    return req > 0 || pkg > 0;
  });

  const careHoursGapOptions: Highcharts.Options = {
    ...chartBaseOptions,
    chart: { ...chartBaseOptions.chart, type: "column" },
    title: { ...chartBaseOptions.title, text: "Care Hours by Locality" },
    subtitle: {
      ...chartBaseOptions.subtitle,
      text: "Requested vs brokered weekly hours across all active localities",
    },
    xAxis: {
      categories: allLocalityNames,
      crosshair: true,
      labels: { style: { fontSize: "11px", color: "#6b7280" }, rotation: -30 },
    },
    yAxis: {
      title: { text: "Weekly Hours", style: { color: "#6b7280" } },
      gridLineColor: "#f3f4f6",
      labels: { style: { color: "#6b7280" } },
    },
    tooltip: {
      ...chartBaseOptions.tooltip,
      headerFormat: "<b>{point.key}</b><br/>",
      pointFormat:
        '<span style="color:{point.color}">●</span> {series.name}: <b>{point.y:.1f} hrs</b><br/>',
      shared: true,
    },
    plotOptions: {
      column: {
        borderRadius: 3,
        groupPadding: 0.15,
        dataLabels: { enabled: false },
      },
    },
    series: [
      {
        type: "column",
        name: "Requested",
        data: allLocalityNames.map(
          (name) =>
            analyticsRequests.localities.find((l) => l.name === name)
              ?.totalHours ?? 0
        ),
        color: "#3b82f6",
      },
      {
        type: "column",
        name: "Brokered",
        data: allLocalityNames.map(
          (name) =>
            analyticsPackages.localities.find((l) => l.name === name)
              ?.totalHours ?? 0
        ),
        color: "#10b981",
      },
    ],
  };

  // ── Chart 2: Attendance Allowance Pipeline ───────────────────────────────
  const aa = attendanceAllowance.overallInReceipt;
  const receivingLow = Math.max(0, aa.totalReceiving - aa.totalReceivingHigh);
  const receivingHigh = aa.totalReceivingHigh;
  const pending = aa.totalPending;
  const unsent = aa.totalUnsent;

  const aaPipelineOptions: Highcharts.Options = {
    ...chartBaseOptions,
    chart: { ...chartBaseOptions.chart, type: "bar" },
    title: { ...chartBaseOptions.title, text: "Attendance Allowance Pipeline" },
    subtitle: {
      ...chartBaseOptions.subtitle,
      text: "Current status breakdown across all active clients",
    },
    xAxis: {
      categories: [
        "Receiving (High)",
        "Receiving (Low)",
        "Pending",
        "Unsent",
      ],
      labels: { style: { fontSize: "12px", color: "#374151" } },
    },
    yAxis: {
      title: { text: "Clients", style: { color: "#6b7280" } },
      allowDecimals: false,
      gridLineColor: "#f3f4f6",
      labels: { style: { color: "#6b7280" } },
    },
    tooltip: {
      ...chartBaseOptions.tooltip,
      pointFormat:
        '<span style="color:{point.color}">●</span> <b>{point.y} clients</b><br/>',
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        dataLabels: {
          enabled: true,
          style: { fontSize: "12px", fontWeight: "600", color: "#374151", textOutline: "none" },
          format: "{y}",
        },
        colorByPoint: true,
        colors: ["#6366f1", "#a78bfa", "#f59e0b", "#d1d5db"],
      },
    },
    legend: { enabled: false },
    series: [
      {
        type: "bar",
        name: "Clients",
        data: [receivingHigh, receivingLow, pending, unsent],
      },
    ],
  };

  // ── Chart 3: Monthly Care Hours Trend ─────────────────────────────────────
  const trendCategories: string[] = [];
  const brokeredTrend: number[] = [];
  const requestedTrend: number[] = [];

  if (packagesReportQuery.data && requestsReportQuery.data) {
    for (const yearData of packagesReportQuery.data.years) {
      for (const monthData of yearData.months) {
        trendCategories.push(`${MONTH_NAMES[monthData.month - 1]} ${yearData.year}`);
        brokeredTrend.push(monthData.totalHours);
      }
    }
    for (const yearData of requestsReportQuery.data.years) {
      for (const monthData of yearData.months) {
        requestedTrend.push(monthData.totalHours);
      }
    }
  }

  const monthlyTrendOptions: Highcharts.Options = {
    ...chartBaseOptions,
    chart: { ...chartBaseOptions.chart, type: "areaspline" },
    title: { ...chartBaseOptions.title, text: "Monthly Care Hours Trend" },
    subtitle: {
      ...chartBaseOptions.subtitle,
      text: `Requested vs brokered hours since ${trendStartYear}`,
    },
    xAxis: {
      categories: trendCategories,
      tickInterval: 3,
      labels: { style: { fontSize: "11px", color: "#6b7280" }, rotation: -30 },
    },
    yAxis: {
      title: { text: "Weekly Hours", style: { color: "#6b7280" } },
      gridLineColor: "#f3f4f6",
      labels: { style: { color: "#6b7280" } },
    },
    tooltip: {
      ...chartBaseOptions.tooltip,
      shared: true,
      pointFormat:
        '<span style="color:{point.color}">●</span> {series.name}: <b>{point.y:.1f} hrs</b><br/>',
    },
    plotOptions: {
      areaspline: {
        fillOpacity: 0.15,
        marker: { enabled: false, states: { hover: { enabled: true, radius: 4 } } },
        lineWidth: 2,
      },
    },
    series: [
      {
        type: "areaspline",
        name: "Requested",
        data: requestedTrend,
        color: "#3b82f6",
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, "rgba(59,130,246,0.25)"],
            [1, "rgba(59,130,246,0)"],
          ],
        },
      },
      {
        type: "areaspline",
        name: "Brokered",
        data: brokeredTrend,
        color: "#10b981",
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, "rgba(16,185,129,0.25)"],
            [1, "rgba(16,185,129,0)"],
          ],
        },
      },
    ],
  };

  // ── Chart 4: Service Mix (horizontal bar) ─────────────────────────────────
  const servicesSorted = [...analyticsPackages.services]
    .filter((s) => s.totalHours > 0)
    .sort((a, b) => b.totalHours - a.totalHours);

  const serviceMixOptions: Highcharts.Options = {
    ...chartBaseOptions,
    chart: { ...chartBaseOptions.chart, type: "bar" },
    title: { ...chartBaseOptions.title, text: "Brokered Hours by Service Type" },
    subtitle: {
      ...chartBaseOptions.subtitle,
      text: "Active packages ranked by weekly hours delivered",
    },
    xAxis: {
      categories: servicesSorted.map((s) => s.name),
      labels: { style: { fontSize: "11px", color: "#374151" } },
    },
    yAxis: {
      title: { text: "Weekly Hours", style: { color: "#6b7280" } },
      gridLineColor: "#f3f4f6",
      labels: { style: { color: "#6b7280" } },
    },
    tooltip: {
      ...chartBaseOptions.tooltip,
      pointFormat:
        '<span style="color:{point.color}">●</span> <b>{point.y:.1f} hrs/week</b><br/>',
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        dataLabels: {
          enabled: true,
          format: "{y:.1f}",
          style: { fontSize: "11px", fontWeight: "500", color: "#6b7280", textOutline: "none" },
        },
      },
    },
    legend: { enabled: false },
    series: [
      {
        type: "bar",
        name: "Weekly Hours",
        data: servicesSorted.map((s, i) => ({
          y: s.totalHours,
          color: `hsl(${210 + i * 18}, 65%, ${55 - i * 2}%)`,
        })),
      },
    ],
  };

  // ── Chart 5: Deprivation Donut ─────────────────────────────────────────────
  const deprivationDonutOptions: Highcharts.Options = {
    ...chartBaseOptions,
    chart: { ...chartBaseOptions.chart, type: "pie" },
    title: { ...chartBaseOptions.title, text: "Requests by Deprivation Category" },
    subtitle: {
      ...chartBaseOptions.subtitle,
      text: "Distribution of care demand across deprivation indices",
    },
    tooltip: {
      ...chartBaseOptions.tooltip,
      pointFormat:
        '<span style="color:{point.color}">●</span> {point.name}: <b>{point.y:.1f} hrs</b> ({point.percentage:.1f}%)<br/>',
    },
    plotOptions: {
      pie: {
        innerSize: "55%",
        borderWidth: 2,
        borderColor: "#ffffff",
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b><br/>{point.percentage:.1f}%",
          style: { fontSize: "11px", fontWeight: "500", color: "#374151", textOutline: "none" },
          distance: 20,
        },
      },
    },
    legend: { enabled: false },
    series: [
      {
        type: "pie",
        name: "Weekly Hours",
        data: analyticsRequestsDeprivation.deprivationCategories
          .filter((d) => d.totalHours > 0)
          .map((d, i) => ({
            name: d.name,
            y: d.totalHours,
            color: ["#6366f1", "#3b82f6", "#10b981", "#f59e0b"][i % 4],
          })),
      },
    ],
  };

  const isTrendLoading =
    packagesReportQuery.isLoading || requestsReportQuery.isLoading;

  return (
    <div className="space-y-6">
      {/* Care Hours Gap — full width */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <HighchartsReact highcharts={Highcharts} options={careHoursGapOptions} />
      </div>

      {/* Row 2: AA Pipeline + Service Mix */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <HighchartsReact highcharts={Highcharts} options={aaPipelineOptions} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <HighchartsReact highcharts={Highcharts} options={serviceMixOptions} />
        </div>
      </div>

      {/* Row 3: Monthly Trend — full width */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        {isTrendLoading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            Loading trend data…
          </div>
        ) : (
          <HighchartsReact highcharts={Highcharts} options={monthlyTrendOptions} />
        )}
      </div>

      {/* Row 4: Deprivation donut */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <HighchartsReact highcharts={Highcharts} options={deprivationDonutOptions} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <HighchartsReact
            highcharts={Highcharts}
            options={{
              ...chartBaseOptions,
              chart: { ...chartBaseOptions.chart, type: "pie" },
              title: { ...chartBaseOptions.title, text: "Packages by Deprivation Category" },
              subtitle: {
                ...chartBaseOptions.subtitle,
                text: "Distribution of brokered care across deprivation indices",
              },
              tooltip: {
                ...chartBaseOptions.tooltip,
                pointFormat:
                  '<span style="color:{point.color}">●</span> {point.name}: <b>{point.y:.1f} hrs</b> ({point.percentage:.1f}%)<br/>',
              },
              plotOptions: {
                pie: {
                  innerSize: "55%",
                  borderWidth: 2,
                  borderColor: "#ffffff",
                  dataLabels: {
                    enabled: true,
                    format: "<b>{point.name}</b><br/>{point.percentage:.1f}%",
                    style: { fontSize: "11px", fontWeight: "500", color: "#374151", textOutline: "none" },
                    distance: 20,
                  },
                },
              },
              legend: { enabled: false },
              series: [
                {
                  type: "pie",
                  name: "Weekly Hours",
                  data: analyticsPackagesDeprivation.deprivationCategories
                    .filter((d) => d.totalHours > 0)
                    .map((d, i) => ({
                      name: d.name,
                      y: d.totalHours,
                      color: ["#6366f1", "#3b82f6", "#10b981", "#f59e0b"][i % 4],
                    })),
                },
              ],
            }}
          />
        </div>
      </div>
    </div>
  );
}
