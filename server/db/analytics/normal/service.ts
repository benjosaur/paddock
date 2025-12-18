import { ClientService } from "../../client/service";
import { PackageService } from "../../package/service";
import { RequestService } from "../../requests/service";
import { VolunteerService } from "../../volunteer/service";
import { firstYear, months, ServiceOption, serviceOptions } from "shared/const";
import {
  CrossSection,
  Package,
  Report,
  ReportYear,
  RequestMetadata,
  reportMonthSchema,
} from "shared";

const infoOption: ServiceOption = "Information";

export class NormalReportService {
  clientService = new ClientService();
  requestService = new RequestService();
  packageService = new PackageService();
  volunteerService = new VolunteerService();

  async generateActiveRequestsCrossSection(user: User): Promise<CrossSection> {
    const requests =
      await this.requestService.getAllWithoutInfoNotEndedYetWithPackages(user);
    const crossSection: CrossSection = {
      totalHours: 0,
      localities: [],
      services: [],
    };
    for (const request of requests) {
      const weeklyHours = request.details.weeklyHours;
      crossSection.totalHours = parseFloat(
        (crossSection.totalHours + weeklyHours).toFixed(2)
      );
      this.addHoursToReportLocality(
        weeklyHours,
        crossSection.localities,
        request.details.address.locality,
        request.details.services
      );
      this.addHoursToReportService(
        weeklyHours,
        crossSection.services,
        request.details.services
      );
    }
    return crossSection;
  }

  async generateActivePackagesCrossSection(user: User): Promise<CrossSection> {
    const packages = await this.packageService.getAllWithoutInfoNotEndedYet(
      user
    );
    const crossSection: CrossSection = {
      totalHours: 0,
      localities: [],
      services: [],
    };
    for (const pkg of packages) {
      const locality =
        "address" in pkg.details ? pkg.details.address.locality : "Unknown";
      const weeklyHours = pkg.details.weeklyHours;
      crossSection.totalHours = parseFloat(
        (crossSection.totalHours + weeklyHours).toFixed(2)
      );
      this.addHoursToReportLocality(
        weeklyHours,
        crossSection.localities,
        locality,
        pkg.details.services
      );
      this.addHoursToReportService(
        weeklyHours,
        crossSection.services,
        pkg.details.services
      );
    }
    return crossSection;
  }

  async generateRequestsReport(
    user: User,
    isInfo: boolean,
    startYear: number = firstYear
  ): Promise<Report> {
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentYear = parseInt(currentDate.slice(0, 4));
    const requests = isInfo
      ? await this.requestService.getAllInfoMetadata(user, startYear)
      : await this.requestService.getAllMetadataWithoutInfo(user, startYear);
    const report = this.constructEmptyReport(startYear, currentYear);
    for (const request of requests) {
      this.addItemToReport(request, report, isInfo);
    }
    return report;
  }

  async generatePackagesReport(
    user: User,
    startYear: number = firstYear,
    isInfo: boolean = false
  ): Promise<Report> {
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentYear = parseInt(currentDate.slice(0, 4));
    const packages = await this.packageService.getAllWithoutInfo(
      user,
      startYear
    );
    const report = this.constructEmptyReport(startYear, currentYear);
    for (const pkg of packages) {
      this.addItemToReport(pkg, report, isInfo);
    }
    return report;
  }

  async generateCoordinatorReport(
    user: User,
    startYear: number = firstYear,
    isInfo: boolean = true
  ): Promise<Report> {
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentYear = parseInt(currentDate.slice(0, 4));
    const packages = await this.volunteerService.getAllPackagesByCoordinator(
      user,
      startYear
    );
    const report = this.constructEmptyReport(startYear, currentYear);
    for (const pkg of packages) {
      this.addItemToReport(pkg, report, isInfo);
    }
    return report;
  }

  // shared helpers (normal)
  private constructEmptyReport(startYear: number, currentYear: number): Report {
    const emptyReport: Report = { years: [] };
    for (let year = startYear; year <= currentYear; year++) {
      emptyReport.years.push(this.generateEmptyYear(year));
    }
    return emptyReport;
  }

  private generateEmptyYear(year: number): ReportYear {
    const monthReports = [] as ReportYear["months"];
    for (const month of months) {
      monthReports.push(reportMonthSchema.parse({ month }));
    }
    return {
      year,
      totalHours: 0,
      localities: [],
      services: [],
      months: monthReports,
    };
  }

  private addItemToReport(
    item: RequestMetadata | Package,
    report: Report,
    isInfo: boolean
  ): void {
    const startDate = item.startDate;
    const endDate =
      item.endDate === "open"
        ? new Date().toISOString().slice(0, 10)
        : item.endDate;
    if (startDate > endDate) return;
    if (
      !isInfo &&
      item.details.services.some((s) => s === infoOption) &&
      item.details.services.length == 1
    ) {
      return;
    }
    const startYear = parseInt(startDate.slice(0, 4));
    const startMonth = parseInt(startDate.slice(5, 7));
    const startDay = parseInt(startDate.slice(8, 10));
    const endYear = parseInt(endDate.slice(0, 4));
    const endMonth = parseInt(endDate.slice(5, 7));
    const endDay = parseInt(endDate.slice(8, 10));

    let currentDay = startDay;
    let currentMonth = startMonth;
    let currentYear = startYear;

    this.addHoursToReport(
      item.details.oneOffStartDateHours,
      report,
      item,
      startYear,
      startMonth
    );

    while (
      currentYear < endYear ||
      (currentYear == endYear && currentMonth < endMonth)
    ) {
      const daysInMonth = this.getDaysInMonth(currentYear, currentMonth);
      const hoursToAdd =
        item.details.weeklyHours * ((daysInMonth - currentDay + 1) / 7);
      this.addHoursToReport(
        hoursToAdd,
        report,
        item,
        currentYear,
        currentMonth
      );
      currentDay = 1;
      if (currentMonth == 12) {
        currentMonth = 1;
        currentYear++;
      } else {
        currentMonth++;
      }
    }
    const hoursToAdd = item.details.weeklyHours * ((endDay - currentDay) / 7);
    this.addHoursToReport(hoursToAdd, report, item, currentYear, currentMonth);
  }

  private getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

  private addHoursToReport(
    hours: number,
    report: Report,
    item: RequestMetadata | Package,
    year: number,
    month: number
  ) {
    const serviceNames = item.details.services;
    const localityName =
      "address" in item.details ? item.details.address.locality : "Unknown";
    const reportYear = report.years.find((ry) => ry.year === year);
    if (!reportYear) throw new Error(`Year ${year} not found in report`);
    reportYear.totalHours = parseFloat(
      (reportYear.totalHours + hours).toFixed(2)
    );
    this.addHoursToReportService(hours, reportYear.services, serviceNames);
    this.addHoursToReportLocality(
      hours,
      reportYear.localities,
      localityName,
      serviceNames
    );
    const reportMonth = reportYear.months.find((rm) => rm.month == month);
    if (!reportMonth)
      throw new Error(`Month ${month} not found in report year ${year}`);
    reportMonth.totalHours = parseFloat(
      (reportMonth.totalHours + hours).toFixed(2)
    );
    this.addHoursToReportService(hours, reportMonth.services, serviceNames);
    this.addHoursToReportLocality(
      hours,
      reportMonth.localities,
      localityName,
      serviceNames
    );
  }

  private addHoursToReportLocality(
    hours: number,
    reportLocalities:
      | Report["years"][number]["localities"]
      | Report["years"][number]["months"][number]["localities"],
    locality: string,
    serviceNames: string[]
  ) {
    let reportLocality = reportLocalities.find((l) => l.name == locality);
    if (!reportLocality) {
      reportLocality = {
        name: locality,
        totalHours: parseFloat(hours.toFixed(2)),
        services: [],
      };
      reportLocalities.push(reportLocality);
    } else {
      reportLocality.totalHours = parseFloat(
        (reportLocality.totalHours + hours).toFixed(2)
      );
    }
    this.addHoursToReportService(hours, reportLocality.services, serviceNames);
  }

  private addHoursToReportService(
    hours: number,
    reportServices:
      | Report["years"][number]["services"]
      | Report["years"][number]["localities"][number]["services"]
      | Report["years"][number]["months"][number]["services"]
      | Report["years"][number]["months"][number]["localities"][number]["services"],
    serviceNames: string[]
  ) {
    for (const serviceName of serviceNames) {
      if (
        serviceOptions.includes(serviceName as (typeof serviceOptions)[number])
      ) {
        const reportService = reportServices.find((s) => s.name == serviceName);
        if (!reportService) {
          reportServices.push({
            name: serviceName as (typeof serviceOptions)[number],
            totalHours: parseFloat(hours.toFixed(2)),
          });
        } else {
          reportService.totalHours = parseFloat(
            (reportService.totalHours + hours).toFixed(2)
          );
        }
      } else {
        const otherService = reportServices.find((s) => s.name == "Other");
        if (otherService) {
          otherService.totalHours = parseFloat(
            (otherService.totalHours + hours).toFixed(2)
          );
        } else {
          reportServices.push({
            name: "Other",
            totalHours: parseFloat(hours.toFixed(2)),
          });
        }
      }
    }
  }
}
