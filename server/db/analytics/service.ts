/* 
- **Generate Total Active Requests By PostCode & Service**
- **Generate Total Active Packages By PostCode & Service**

- **Generate Requests Report** (start yyyy)
	- Monthly with Yearly metrics
	- GSI2-PK == request#{yyyy, yyyy, open}
	- Post Process:
	- Init array
		- [{year:"yyyy", months: [{month: "Jan", villages: [wivey: {service: }, milverton: 0], services: [befriending: 0, transport: 0]}, ...]}, ...]
	- For each request. Get weekly hours. Get Start Date. Get End Date. Derive total days covered in each month / 7 * weeklyHours and append to totalHours. Get village add to village entry. Get service(s), add to each service. Repeat

- **Generate Packages Report** Starting from year yyyy
	- Monthly with Yearly metrics
	- GSI2-PK == package#{yyyy, yyyy, open}
	- Post Process:
	- Init array
		- [{year:"yyyy", months: [{month: "Jan", totalHours: 0, villages: [wivey: 0, milverton: 0], services: [befriending: 0, transport: 0]}, ...]}, ...]
	- For each request. Get weekly hours. Get Start Date. Get End Date. Derive total days covered in each month / 7 * weeklyHours and append to totalHours. Get village add to village entry. Get service(s), add to each service. Repeat
*/

import { firstYear, months, ServiceOption, serviceOptions } from "shared/const";
import { PackageService } from "../package/service";
import { RequestService } from "../requests/service";
import {
  Package,
  RequestMetadata,
  CrossSection,
  DeprivationCrossSection,
  Report,
  DeprivationReport,
  reportMonthSchema,
  deprivationReportMonthSchema,
  ReportYear,
  DeprivationReportYear,
  AttendanceAllowanceReport,
} from "shared";
import { ClientService } from "../client/service";
import { VolunteerService } from "../volunteer/service";

const infoOption: ServiceOption = "Information";

export class ReportService {
  clientService = new ClientService();
  requestService = new RequestService();
  packageService = new PackageService();
  volunteerService = new VolunteerService();

  async generateAttendanceAllowanceReport(
    user: User
  ): Promise<AttendanceAllowanceReport> {
    try {
      const report: AttendanceAllowanceReport = {
        overallInReceipt: {
          total: 0,
          totalHigh: 0,
        },
        thisMonthConfirmed: {
          total: 0,
          totalHigh: 0,
        },
      };
      const currentDate = new Date().toISOString().slice(0, 10);
      const currentYear = parseInt(currentDate.slice(0, 4));
      const currentMonth = parseInt(currentDate.slice(5, 7));

      const clients = await this.clientService.getAllNotEnded(user);
      for (const client of clients) {
        if (client.endDate) {
          // probably should be archived (client end dates present mean terminated)
          continue;
        }
        const isReceivingHigh =
          client.details.attendanceAllowance.status === "High";

        let confirmationYear, confirmationMonth;
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
          report.thisMonthConfirmed.total++;
          report.thisMonthConfirmed.totalHigh += isReceivingHigh ? 1 : 0;
        }
        report.overallInReceipt.total++;
        report.overallInReceipt.totalHigh += isReceivingHigh ? 1 : 0;
      }
      return report;
    } catch (error) {
      console.error(
        "Service Layer Error generating attendance allowance report:",
        error
      );
      throw error;
    }
  }

  async generateActiveRequestsCrossSection(user: User): Promise<CrossSection> {
    try {
      const requests =
        await this.requestService.getAllWithoutInfoNotEndedYetWithPackages(
          user
        );
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
    } catch (error) {
      console.error(
        "Service Layer Error generating active requests cross section:",
        error
      );
      throw error;
    }
  }

  async generateActivePackagesCrossSection(user: User): Promise<CrossSection> {
    try {
      const packages = await this.packageService.getAllWithoutInfoNotEndedYet(
        user
      );
      const crossSection: CrossSection = {
        totalHours: 0,
        localities: [],
        services: [],
      };
      for (const pkg of packages) {
        const weeklyHours = pkg.details.weeklyHours;
        crossSection.totalHours = parseFloat(
          (crossSection.totalHours + weeklyHours).toFixed(2)
        );
        this.addHoursToReportLocality(
          weeklyHours,
          crossSection.localities,
          pkg.details.address.locality,
          pkg.details.services
        );
        this.addHoursToReportService(
          weeklyHours,
          crossSection.services,
          pkg.details.services
        );
      }
      return crossSection;
    } catch (error) {
      console.error(
        "Service Layer Error generating active packages cross section:",
        error
      );
      throw error;
    }
  }

  async generateActiveRequestsDeprivationCrossSection(
    user: User
  ): Promise<DeprivationCrossSection> {
    try {
      const requests =
        await this.requestService.getAllWithoutInfoNotEndedYetWithPackages(
          user
        );
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
    } catch (error) {
      console.error(
        "Service Layer Error generating active requests deprivation cross section:",
        error
      );
      throw error;
    }
  }

  async generateActivePackagesDeprivationCrossSection(
    user: User
  ): Promise<DeprivationCrossSection> {
    try {
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
        const deprivationCategory = this.getDeprivationCategory(
          pkg.details.address.deprivation
        );
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
    } catch (error) {
      console.error(
        "Service Layer Error generating active packages deprivation cross section:",
        error
      );
      throw error;
    }
  }

  async generateRequestsReport(
    user: User,
    isInfo: boolean,
    startYear: number = firstYear
  ): Promise<Report> {
    try {
      // construct empty report
      const currentDate = new Date().toISOString().slice(0, 10);
      const currentYear = parseInt(currentDate.slice(0, 4));
      const requests = isInfo
        ? await this.requestService.getAllInfoMetadata(user, startYear)
        : await this.requestService.getAllMetadataWithoutInfo(user, startYear);
      const report = this.constructEmptyReport(startYear, currentYear);
      // iterate through requests => for each find start date, end date, weekly hours, locality, service
      for (const request of requests) {
        this.addItemToReport(request, report);
      }
      return report;
    } catch (error) {
      console.error("Service Layer Error generating requests report:", error);
      throw error;
    }
  }

  async generatePackagesReport(
    user: User,
    startYear: number = firstYear
  ): Promise<Report> {
    try {
      // construct empty report
      const currentDate = new Date().toISOString().slice(0, 10);
      const currentYear = parseInt(currentDate.slice(0, 4));
      const packages = await this.packageService.getAllWithoutInfo(
        user,
        startYear
      );
      const report = this.constructEmptyReport(startYear, currentYear);
      // iterate through packages => for each find start date, end date, weekly hours, locality, service
      for (const pkg of packages) {
        this.addItemToReport(pkg, report);
      }
      return report;
    } catch (error) {
      console.error("Service Layer Error generating packages report:", error);
      throw error;
    }
  }

  async generateCoordinatorReport(
    user: User,
    startYear: number = firstYear
  ): Promise<Report> {
    try {
      // construct empty report
      const currentDate = new Date().toISOString().slice(0, 10);
      const currentYear = parseInt(currentDate.slice(0, 4));
      const packages = await this.volunteerService.getAllPackagesByCoordinator(
        user,
        startYear
      );
      const report = this.constructEmptyReport(startYear, currentYear);
      // iterate through packages => for each find start date, end date, weekly hours, locality, service
      for (const pkg of packages) {
        this.addItemToReport(pkg, report);
      }
      return report;
    } catch (error) {
      console.error(
        "Service Layer Error generating coordinator report:",
        error
      );
      throw error;
    }
  }

  async generateRequestsDeprivationReport(
    user: User,
    isInfo: boolean,
    startYear: number = firstYear
  ): Promise<DeprivationReport> {
    try {
      // construct empty report
      const currentDate = new Date().toISOString().slice(0, 10);
      const currentYear = parseInt(currentDate.slice(0, 4));
      const requests = isInfo
        ? await this.requestService.getAllInfoMetadata(user, startYear)
        : await this.requestService.getAllMetadataWithoutInfo(user, startYear);
      const report = this.constructEmptyDeprivationReport(
        startYear,
        currentYear
      );
      // iterate through requests => for each find start date, end date, weekly hours, deprivation category, service
      for (const request of requests) {
        this.addItemToDeprivationReport(request, report);
      }
      return report;
    } catch (error) {
      console.error(
        "Service Layer Error generating requests deprivation report:",
        error
      );
      throw error;
    }
  }

  async generatePackagesDeprivationReport(
    user: User,
    startYear: number = firstYear
  ): Promise<DeprivationReport> {
    try {
      // construct empty report
      const currentDate = new Date().toISOString().slice(0, 10);
      const currentYear = parseInt(currentDate.slice(0, 4));
      const packages = await this.packageService.getAllWithoutInfo(
        user,
        startYear
      );
      const report = this.constructEmptyDeprivationReport(
        startYear,
        currentYear
      );
      // iterate through packages => for each find start date, end date, weekly hours, deprivation category, service
      for (const pkg of packages) {
        this.addItemToDeprivationReport(pkg, report);
      }
      return report;
    } catch (error) {
      console.error(
        "Service Layer Error generating packages deprivation report:",
        error
      );
      throw error;
    }
  }

  private constructEmptyReport(startYear: number, currentYear: number): Report {
    const emptyReport: Report = {
      years: [],
    };
    for (let year = startYear; year <= currentYear; year++) {
      emptyReport.years.push(this.generateEmptyYear(year));
    }
    return emptyReport;
  }

  private generateEmptyYear(year: number): ReportYear {
    const monthReports = [];
    for (const month of months) {
      monthReports.push(reportMonthSchema.parse({ month: month }));
    }
    return {
      year: year,
      totalHours: 0,
      localities: [],
      services: [],
      months: monthReports,
    };
  }

  private constructEmptyDeprivationReport(
    startYear: number,
    currentYear: number
  ): DeprivationReport {
    const emptyReport: DeprivationReport = {
      years: [],
    };
    for (let year = startYear; year <= currentYear; year++) {
      emptyReport.years.push(this.generateEmptyDeprivationYear(year));
    }
    return emptyReport;
  }

  private generateEmptyDeprivationYear(year: number): DeprivationReportYear {
    const monthReports = [];
    for (const month of months) {
      monthReports.push(deprivationReportMonthSchema.parse({ month: month }));
    }
    return {
      year: year,
      totalHours: 0,
      deprivationCategories: [],
      services: [],
      months: monthReports,
    };
  }
  private addItemToReport(
    item: RequestMetadata | Package,
    report: Report
  ): void {
    const startDate = item.startDate;
    const endDate =
      item.endDate === "open"
        ? new Date().toISOString().slice(0, 10)
        : item.endDate;

    // avoid negative hours if start date in future and end date is open (i.e. set to today)
    if (startDate > endDate) {
      return;
    }

    if (
      item.details.services.includes(infoOption) &&
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
    //now in final month of final year
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
    // Add hours to:
    // year total, year service total, year locality total, year locality service total
    // month total, month service total, month locality total, month locality service total

    const serviceNames = item.details.services;
    const localityName = item.details.address.locality;
    const reportYear = report.years.find(
      (reportYear) => reportYear.year === year
    );
    if (!reportYear) {
      throw new Error(`Year ${year} not found in report`);
    }
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
    const reportMonth = reportYear.months.find(
      (reportMonth) => reportMonth.month == month
    );
    if (!reportMonth) {
      throw new Error(`Month ${month} not found in report year ${year}`);
    }
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
    // also adds to service
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

  private getDeprivationCategory(deprivation: {
    income: boolean;
    health: boolean;
  }): string {
    if (deprivation.health && deprivation.income) {
      return "Health & Income";
    } else if (deprivation.health && !deprivation.income) {
      return "Health Only";
    } else if (!deprivation.health && deprivation.income) {
      return "Income Only";
    } else {
      return "Neither";
    }
  }

  private addItemToDeprivationReport(
    item: RequestMetadata | Package,
    report: DeprivationReport
  ): void {
    const startDate = item.startDate;
    const endDate =
      item.endDate === "open"
        ? new Date().toISOString().slice(0, 10)
        : item.endDate;

    // avoid negative hours if start date in future and end date is open (i.e. set to today)
    if (startDate > endDate) {
      return;
    }

    if (
      item.details.services.includes(infoOption) &&
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
    //now in final month of final year
    const hoursToAdd = item.details.weeklyHours * ((endDay - currentDay) / 7);
    this.addHoursToDeprivationReport(
      hoursToAdd,
      report,
      item,
      currentYear,
      currentMonth
    );
  }

  private addHoursToDeprivationReport(
    hours: number,
    report: DeprivationReport,
    item: RequestMetadata | Package,
    year: number,
    month: number
  ) {
    const serviceNames = item.details.services;
    const deprivationCategory = this.getDeprivationCategory(
      item.details.address.deprivation
    );
    const reportYear = report.years.find(
      (reportYear) => reportYear.year === year
    );
    if (!reportYear) {
      throw new Error(`Year ${year} not found in deprivation report`);
    }
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
    const reportMonth = reportYear.months.find(
      (reportMonth) => reportMonth.month == month
    );
    if (!reportMonth) {
      throw new Error(
        `Month ${month} not found in deprivation report year ${year}`
      );
    }
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
}
