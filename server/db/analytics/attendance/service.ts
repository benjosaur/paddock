import { ClientService } from "../../client/service";
import {
  AttendanceAllowanceCrossSection,
  AttendanceAllowanceReport,
  attendanceAllowanceReportSchema,
} from "shared";
import { attendanceAllowanceStatuses, firstYear, months } from "shared/const";

export class AttendanceReportService {
  clientService = new ClientService();

  async generateAttendanceAllowanceCrossSection(
    user: User
  ): Promise<AttendanceAllowanceCrossSection> {
    const report: AttendanceAllowanceCrossSection = {
      overallInReceipt: {
        total: 0,
        totalHigh: 0,
        totalRequestedHigh: 0,
        totalHighRequestedHigh: 0,
      },
      thisMonthConfirmed: {
        total: 0,
        totalHigh: 0,
        totalRequestedHigh: 0,
        totalHighRequestedHigh: 0,
      },
    };

    const receivingStates: (typeof attendanceAllowanceStatuses)[number][] = [
      "Low",
      "High",
    ];
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentYear = parseInt(currentDate.slice(0, 4));
    const currentMonth = parseInt(currentDate.slice(5, 7));

    const clients = await this.clientService.getAllNotEnded(user);
    for (const client of clients) {
      if (client.endDate !== "open") continue;

      const isReceiving = receivingStates.includes(
        client.details.attendanceAllowance.status
      );
      const isReceivingHigh =
        client.details.attendanceAllowance.status === "High";
      const isRequestedHigh =
        client.details.attendanceAllowance.requestedLevel === "High";
      const isReceivingHighRequestedHigh = isReceivingHigh && isRequestedHigh;

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
        report.thisMonthConfirmed.total += isReceiving ? 1 : 0;
        report.thisMonthConfirmed.totalHigh += isReceivingHigh ? 1 : 0;
        report.thisMonthConfirmed.totalRequestedHigh += isRequestedHigh ? 1 : 0;
        report.thisMonthConfirmed.totalHighRequestedHigh +=
          isReceivingHighRequestedHigh ? 1 : 0;
      }
      report.overallInReceipt.total += isReceiving ? 1 : 0;
      report.overallInReceipt.totalHigh += isReceivingHigh ? 1 : 0;
      report.overallInReceipt.totalRequestedHigh += isRequestedHigh ? 1 : 0;
      report.overallInReceipt.totalHighRequestedHigh +=
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
      const confirmationDate =
        client.details.attendanceAllowance.confirmationDate;
      if (!confirmationDate) continue;
      const confYear = parseInt(confirmationDate.slice(0, 4));
      const confMonth = parseInt(confirmationDate.slice(5, 7));
      if (Number.isNaN(confYear) || Number.isNaN(confMonth)) continue;
      if (confYear < startYear || confYear > currentYear) continue;

      const hours =
        client.details.attendanceAllowance.hoursToCompleteRequest || 0;
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
      // yearly aggregates
      reportYear.total += isReceiving ? 1 : 0;
      reportYear.totalHigh += isReceivingHigh ? 1 : 0;
      reportYear.totalRequestedHigh += isRequestedHigh ? 1 : 0;
      reportYear.totalHighRequestedHigh += isReceivingHighRequestedHigh ? 1 : 0;
      reportYear.totalHours = parseFloat(
        (reportYear.totalHours + hours).toFixed(2)
      );

      const reportMonth = reportYear.months.find((m) => m.month === confMonth);
      if (!reportMonth) continue;
      reportMonth.total += isReceiving ? 1 : 0;
      reportMonth.totalHigh += isReceivingHigh ? 1 : 0;
      reportMonth.totalRequestedHigh += isRequestedHigh ? 1 : 0;
      reportMonth.totalHighRequestedHigh += isReceivingHighRequestedHigh
        ? 1
        : 0;
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
