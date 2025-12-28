import { ClientService } from "../../client/service";
import { VolunteerService } from "../../volunteer/service";
import {
  AttendanceAllowanceCrossSection,
  AttendanceAllowanceReport,
  attendanceAllowanceReportSchema,
} from "shared";
import {
  attendanceAllowanceStatuses,
  firstYear,
  hasRequestedStatuses,
  isReceivingStatuses,
  months,
} from "shared/const";

export class AttendanceReportService {
  clientService = new ClientService();
  volunteerService = new VolunteerService();

  async generateAttendanceAllowanceCrossSection(
    user: User
  ): Promise<AttendanceAllowanceCrossSection> {
    const report: AttendanceAllowanceCrossSection = {
      overallInReceipt: {
        totalRequested: 0,
        totalRequestedHigh: 0,
        totalReceiving: 0,
        totalReceivingHigh: 0,
        totalReceivingHighRequestedHigh: 0,
        totalPending: 0,
        totalUnsent: 0,
      },
      thisMonthConfirmed: {
        totalRequested: 0,
        totalRequestedHigh: 0,
        totalReceiving: 0,
        totalReceivingHigh: 0,
        totalReceivingHighRequestedHigh: 0,
      },
    };

    const currentDate = new Date().toISOString().slice(0, 10);
    const currentYear = parseInt(currentDate.slice(0, 4));
    const currentMonth = parseInt(currentDate.slice(5, 7));

    const clients = await this.clientService.getAllNotEndedYet(user);
    for (const client of clients) {
      if (client.endDate !== "open") continue;

      const hasRequested = hasRequestedStatuses.includes(
        client.details.attendanceAllowance.status
      );
      const hasRequestedHigh =
        client.details.attendanceAllowance.requestedLevel === "High";

      const isReceiving = isReceivingStatuses.includes(
        client.details.attendanceAllowance.status
      );
      const isReceivingHigh =
        client.details.attendanceAllowance.status === "High";

      const isReceivingHighRequestedHigh = isReceivingHigh && hasRequestedHigh;

      let confirmationYear: number | undefined,
        confirmationMonth: number | undefined;
      if (client.details.attendanceAllowance.confirmationDate) {
        const confirmationDate =
          client.details.attendanceAllowance.confirmationDate;
        confirmationYear = parseInt(confirmationDate.slice(0, 4));
        confirmationMonth = parseInt(confirmationDate.slice(5, 7));
      }
      if (
        confirmationYear === currentYear &&
        confirmationMonth === currentMonth
      ) {
        report.thisMonthConfirmed.totalRequested += hasRequested ? 1 : 0;
        report.thisMonthConfirmed.totalRequestedHigh += hasRequestedHigh
          ? 1
          : 0;
        report.thisMonthConfirmed.totalReceiving += isReceiving ? 1 : 0;
        report.thisMonthConfirmed.totalReceivingHigh += isReceivingHigh ? 1 : 0;
        report.thisMonthConfirmed.totalReceivingHighRequestedHigh +=
          isReceivingHighRequestedHigh ? 1 : 0;
      }
      report.overallInReceipt.totalRequested += hasRequested ? 1 : 0;
      report.overallInReceipt.totalRequestedHigh += hasRequestedHigh ? 1 : 0;
      report.overallInReceipt.totalReceiving += isReceiving ? 1 : 0;
      report.overallInReceipt.totalReceivingHigh += isReceivingHigh ? 1 : 0;
      report.overallInReceipt.totalReceivingHighRequestedHigh +=
        isReceivingHighRequestedHigh ? 1 : 0;
    }
    return report;
  }

  async generateAttendanceAllowanceReport(
    user: User,
    startYear: number = firstYear
  ): Promise<AttendanceAllowanceReport> {
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentYear = parseInt(currentDate.slice(0, 4));

    const report: AttendanceAllowanceReport = this.constructEmptyAaReport(
      startYear,
      currentYear
    );

    const clients = await this.clientService.getAll(user);
    for (const client of clients) {
      const requestedDate = client.details.attendanceAllowance.requestedDate;
      const confirmationDate =
        client.details.attendanceAllowance.confirmationDate;
      if (!requestedDate && !confirmationDate) continue;

      const reqYear = parseInt(requestedDate.slice(0, 4));
      const reqMonth = parseInt(requestedDate.slice(5, 7));
      const confYear = parseInt(confirmationDate.slice(0, 4));
      const confMonth = parseInt(confirmationDate.slice(5, 7));

      if (Number.isNaN(confYear) || Number.isNaN(confMonth)) continue;
      if (confYear < startYear || confYear > currentYear) continue;

      const hours =
        client.details.attendanceAllowance.hoursToCompleteRequest || 2;

      const hasRequestedStates: (typeof attendanceAllowanceStatuses)[number][] =
        ["Unsent", "Pending", "Low", "High"];
      const hasRequested = hasRequestedStates.includes(
        client.details.attendanceAllowance.status
      );
      const hasRequestedHigh =
        client.details.attendanceAllowance.requestedLevel === "High";

      const isReceiving = ["Low", "High"].includes(
        client.details.attendanceAllowance.status
      );
      const isReceivingHigh =
        client.details.attendanceAllowance.status === "High";
      const isReceivingHighRequestedHigh = isReceivingHigh && hasRequestedHigh;

      const currentReportYearMatchingReq = report.years.find(
        (y) => y.year === reqYear
      );
      if (currentReportYearMatchingReq) {
        currentReportYearMatchingReq.totalRequested += hasRequested ? 1 : 0;
        currentReportYearMatchingReq.totalRequestedHigh += hasRequestedHigh
          ? 1
          : 0;

        const currentReportMonthMatchingReq =
          currentReportYearMatchingReq.months.find((m) => m.month === reqMonth);

        if (currentReportMonthMatchingReq) {
          currentReportMonthMatchingReq.totalRequested += hasRequested ? 1 : 0;
          currentReportMonthMatchingReq.totalRequestedHigh += hasRequestedHigh
            ? 1
            : 0;
          currentReportMonthMatchingReq.totalHours = parseFloat(
            (currentReportMonthMatchingReq.totalHours + hours).toFixed(2)
          );
        }
      }

      const currentReportYearMatchingConf = report.years.find(
        (y) => y.year === confYear
      );

      if (!currentReportYearMatchingConf) continue;
      // yearly aggregates

      currentReportYearMatchingConf.totalReceiving += isReceiving ? 1 : 0;
      currentReportYearMatchingConf.totalReceivingHigh += isReceivingHigh
        ? 1
        : 0;
      currentReportYearMatchingConf.totalReceivingHighRequestedHigh +=
        isReceivingHighRequestedHigh ? 1 : 0;
      currentReportYearMatchingConf.totalHours = parseFloat(
        (currentReportYearMatchingConf.totalHours + hours).toFixed(2)
      );

      const currentReportMonthMatchingConf =
        currentReportYearMatchingConf.months.find((m) => m.month === confMonth);
      if (!currentReportMonthMatchingConf) continue;

      currentReportMonthMatchingConf.totalReceiving += isReceiving ? 1 : 0;
      currentReportMonthMatchingConf.totalReceivingHigh += isReceivingHigh
        ? 1
        : 0;
      currentReportMonthMatchingConf.totalReceivingHighRequestedHigh +=
        isReceivingHighRequestedHigh ? 1 : 0;
    }

    return report;
  }

  async generateCoordinatorReport(
    user: User,
    startYear: number = firstYear
  ): Promise<AttendanceAllowanceReport> {
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentYear = parseInt(currentDate.slice(0, 4));

    const report: AttendanceAllowanceReport = this.constructEmptyAaReport(
      startYear,
      currentYear
    );

    const coordinatorIds = new Set(
      await this.volunteerService.getCoordinatorIds(user)
    );

    const clients = await this.clientService.getAll(user);
    for (const client of clients) {
      const completedById = client.details.attendanceAllowance.completedBy.id;
      if (!completedById || !coordinatorIds.has(completedById)) continue;

      const confirmationDate =
        client.details.attendanceAllowance.confirmationDate;
      if (!confirmationDate) continue;
      const confYear = parseInt(confirmationDate.slice(0, 4));
      const confMonth = parseInt(confirmationDate.slice(5, 7));
      if (Number.isNaN(confYear) || Number.isNaN(confMonth)) continue;
      if (confYear < startYear || confYear > currentYear) continue;

      const hours =
        client.details.attendanceAllowance.hoursToCompleteRequest || 0;

      const hasRequestedStates: (typeof attendanceAllowanceStatuses)[number][] =
        ["Unsent", "Pending", "Low", "High"];
      const hasRequested = hasRequestedStates.includes(
        client.details.attendanceAllowance.status
      );
      const isReceiving = ["Low", "High"].includes(
        client.details.attendanceAllowance.status
      );
      const isReceivingHigh =
        client.details.attendanceAllowance.status === "High";
      const isRequestedHigh =
        client.details.attendanceAllowance.requestedLevel === "High";
      const isReceivingHighRequestedHigh = isReceivingHigh && isRequestedHigh;

      const reportYear = report.years.find((y) => y.year === confYear);
      if (!reportYear) continue;
      reportYear.totalRequested += hasRequested ? 1 : 0;
      reportYear.totalRequestedHigh += isRequestedHigh ? 1 : 0;
      reportYear.totalReceiving += isReceiving ? 1 : 0;
      reportYear.totalReceivingHigh += isReceivingHigh ? 1 : 0;
      reportYear.totalReceivingHighRequestedHigh += isReceivingHighRequestedHigh
        ? 1
        : 0;
      reportYear.totalHours = parseFloat(
        (reportYear.totalHours + hours).toFixed(2)
      );

      const reportMonth = reportYear.months.find((m) => m.month === confMonth);
      if (!reportMonth) continue;
      reportMonth.totalRequested += hasRequested ? 1 : 0;
      reportMonth.totalRequestedHigh += isRequestedHigh ? 1 : 0;
      reportMonth.totalReceiving += isReceiving ? 1 : 0;
      reportMonth.totalReceivingHigh += isReceivingHigh ? 1 : 0;
      reportMonth.totalReceivingHighRequestedHigh +=
        isReceivingHighRequestedHigh ? 1 : 0;
      reportMonth.totalHours = parseFloat(
        (reportMonth.totalHours + hours).toFixed(2)
      );
    }

    return report;
  }

  private constructEmptyAaReport(
    startYear: number,
    currentYear: number
  ): AttendanceAllowanceReport {
    const empty: AttendanceAllowanceReport = { years: [] };
    for (let y = startYear; y <= currentYear; y++) {
      empty.years.push(this.generateEmptyAaYear(y));
    }
    return empty;
  }

  private generateEmptyAaYear(
    year: number
  ): AttendanceAllowanceReport["years"][number] {
    const monthReports = months.map((month) => ({
      // defaults will be applied by schema parsing below
      month,
    }));
    const parsed = attendanceAllowanceReportSchema.parse({
      years: [
        {
          year,
          months: monthReports,
        },
      ],
    });
    return parsed.years[0];
  }
}
