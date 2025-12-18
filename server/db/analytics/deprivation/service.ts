import { PackageService } from "../../package/service";
import { RequestService } from "../../requests/service";
import { firstYear, months, ServiceOption, serviceOptions } from "shared/const";
import {
  DeprivationCrossSection,
  DeprivationReport,
  DeprivationReportYear,
  Package,
  RequestMetadata,
  deprivationReportMonthSchema,
} from "shared";

const infoOption: ServiceOption = "Information";

export class DeprivationReportService {
  requestService = new RequestService();
  packageService = new PackageService();

  async generateActiveRequestsDeprivationCrossSection(
    user: User
  ): Promise<DeprivationCrossSection> {
    const requests =
      await this.requestService.getAllWithoutInfoNotEndedYetWithPackages(user);
    const crossSection: DeprivationCrossSection = {
      totalHours: 0,
      deprivationCategories: [],
      services: [],
    };
    for (const request of requests) {
      const weeklyHours = request.details.weeklyHours;
      crossSection.totalHours = parseFloat(
        (crossSection.totalHours + weeklyHours).toFixed(2)
      );
      const deprivationCategory = this.getDeprivationCategory(
        request.details.address.deprivation
      );
      this.addHoursToReportDeprivationCategory(
        weeklyHours,
        crossSection.deprivationCategories,
        deprivationCategory,
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

  async generateActivePackagesDeprivationCrossSection(
    user: User
  ): Promise<DeprivationCrossSection> {
    const packages = await this.packageService.getAllWithoutInfoNotEndedYet(
      user
    );
    const crossSection: DeprivationCrossSection = {
      totalHours: 0,
      deprivationCategories: [],
      services: [],
    };
    for (const pkg of packages) {
      const weeklyHours = pkg.details.weeklyHours;
      crossSection.totalHours = parseFloat(
        (crossSection.totalHours + weeklyHours).toFixed(2)
      );
      const deprivationCategory =
        "address" in pkg.details
          ? this.getDeprivationCategory(pkg.details.address.deprivation)
          : "Unknown";
      this.addHoursToReportDeprivationCategory(
        weeklyHours,
        crossSection.deprivationCategories,
        deprivationCategory,
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

  async generateRequestsDeprivationReport(
    user: User,
    isInfo: boolean,
    startYear: number = firstYear
  ): Promise<DeprivationReport> {
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentYear = parseInt(currentDate.slice(0, 4));
    const requests = isInfo
      ? await this.requestService.getAllInfoMetadata(user, startYear)
      : await this.requestService.getAllMetadataWithoutInfo(user, startYear);
    const report = this.constructEmptyDeprivationReport(startYear, currentYear);
    for (const request of requests) {
      this.addItemToDeprivationReport(request, report, isInfo);
    }
    return report;
  }

  async generatePackagesDeprivationReport(
    user: User,
    startYear: number = firstYear,
    isInfo: boolean = false
  ): Promise<DeprivationReport> {
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentYear = parseInt(currentDate.slice(0, 4));
    const packages = await this.packageService.getAllWithoutInfo(
      user,
      startYear
    );
    const report = this.constructEmptyDeprivationReport(startYear, currentYear);
    for (const pkg of packages) {
      this.addItemToDeprivationReport(pkg, report, isInfo);
    }
    return report;
  }

  private constructEmptyDeprivationReport(
    startYear: number,
    currentYear: number
  ): DeprivationReport {
    const emptyReport: DeprivationReport = { years: [] };
    for (let year = startYear; year <= currentYear; year++) {
      emptyReport.years.push(this.generateEmptyDeprivationYear(year));
    }
    return emptyReport;
  }

  private generateEmptyDeprivationYear(year: number): DeprivationReportYear {
    const monthReports = [] as DeprivationReportYear["months"];
    for (const month of months) {
      monthReports.push(deprivationReportMonthSchema.parse({ month }));
    }
    return {
      year,
      totalHours: 0,
      deprivationCategories: [],
      services: [],
      months: monthReports,
    };
  }

  private getDeprivationCategory(deprivation: {
    income: boolean;
    health: boolean;
  }): string {
    if (deprivation.health && deprivation.income) return "Health & Income";
    else if (deprivation.health && !deprivation.income) return "Health Only";
    else if (!deprivation.health && deprivation.income) return "Income Only";
    else return "Neither";
  }

  private addItemToDeprivationReport(
    item: RequestMetadata | Package,
    report: DeprivationReport,
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

    this.addHoursToDeprivationReport(
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
      this.addHoursToDeprivationReport(
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
    this.addHoursToDeprivationReport(
      hoursToAdd,
      report,
      item,
      currentYear,
      currentMonth
    );
  }

  private getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

  private addHoursToDeprivationReport(
    hours: number,
    report: DeprivationReport,
    item: RequestMetadata | Package,
    year: number,
    month: number
  ) {
    const serviceNames = item.details.services;
    const deprivationCategory =
      "address" in item.details
        ? this.getDeprivationCategory(item.details.address.deprivation)
        : "Unknown";
    const reportYear = report.years.find((ry) => ry.year === year);
    if (!reportYear)
      throw new Error(`Year ${year} not found in deprivation report`);
    reportYear.totalHours = parseFloat(
      (reportYear.totalHours + hours).toFixed(2)
    );
    this.addHoursToReportService(hours, reportYear.services, serviceNames);
    this.addHoursToReportDeprivationCategory(
      hours,
      reportYear.deprivationCategories,
      deprivationCategory,
      serviceNames
    );
    const reportMonth = reportYear.months.find((rm) => rm.month == month);
    if (!reportMonth)
      throw new Error(
        `Month ${month} not found in deprivation report year ${year}`
      );
    reportMonth.totalHours = parseFloat(
      (reportMonth.totalHours + hours).toFixed(2)
    );
    this.addHoursToReportService(hours, reportMonth.services, serviceNames);
    this.addHoursToReportDeprivationCategory(
      hours,
      reportMonth.deprivationCategories,
      deprivationCategory,
      serviceNames
    );
  }

  private addHoursToReportDeprivationCategory(
    hours: number,
    reportDeprivationCategories:
      | DeprivationReport["years"][number]["deprivationCategories"]
      | DeprivationReport["years"][number]["months"][number]["deprivationCategories"],
    deprivationCategory: string,
    serviceNames: string[]
  ) {
    let reportDeprivationCategory = reportDeprivationCategories.find(
      (d) => d.name == deprivationCategory
    );
    if (!reportDeprivationCategory) {
      reportDeprivationCategory = {
        name: deprivationCategory,
        totalHours: parseFloat(hours.toFixed(2)),
        services: [],
      };
      reportDeprivationCategories.push(reportDeprivationCategory);
    } else {
      reportDeprivationCategory.totalHours = parseFloat(
        (reportDeprivationCategory.totalHours + hours).toFixed(2)
      );
    }
    this.addHoursToReportService(
      hours,
      reportDeprivationCategory.services,
      serviceNames
    );
  }

  private addHoursToReportService(
    hours: number,
    reportServices:
      | DeprivationReport["years"][number]["services"]
      | DeprivationReport["years"][number]["months"][number]["services"],
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
