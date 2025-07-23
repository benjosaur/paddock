/* 
- **Generate Total Active Requests By PostCode & Service**
- **Generate Total Active Packages By PostCode & Service**

- **Generate Requests Report** (start yyyy)
	- Monthly with Yearly metrics
	- GSI3-PK == request#{yyyy, yyyy, open}
	- Post Process:
	- Init array
		- [{year:"yyyy", months: [{month: "Jan", villages: [wivey: {service: }, milverton: 0], services: [befriending: 0, transport: 0]}, ...]}, ...]
	- For each request. Get weekly hours. Get Start Date. Get End Date. Derive total days covered in each month / 7 * weeklyHours and append to totalHours. Get village add to village entry. Get service(s), add to each service. Repeat

- **Generate Packages Report** Starting from year yyyy
	- Monthly with Yearly metrics
	- GSI3-PK == package#{yyyy, yyyy, open}
	- Post Process:
	- Init array
		- [{year:"yyyy", months: [{month: "Jan", totalHours: 0, villages: [wivey: 0, milverton: 0], services: [befriending: 0, transport: 0]}, ...]}, ...]
	- For each request. Get weekly hours. Get Start Date. Get End Date. Derive total days covered in each month / 7 * weeklyHours and append to totalHours. Get village add to village entry. Get service(s), add to each service. Repeat
*/

import { firstYear, months, serviceOptions } from "shared/const";
import { PackageService } from "../package/service";
import { RequestService } from "../requests/service";
import {
  Package,
  RequestMetadata,
  CrossSection,
  Report,
  reportMonthSchema,
  ReportYear,
} from "shared";

export class ReportService {
  requestService = new RequestService();
  packageService = new PackageService();

  async generateActiveRequestsCrossSection(user: User): Promise<CrossSection> {
    const requests = await this.requestService.getAllNotEndedYetWithPackages(
      user
    );
    const crossSection: CrossSection = {
      totalHours: 0,
      localities: [],
      services: [],
    };
    for (const request of requests) {
      const weeklyHours = request.details.weeklyHours;
      crossSection.totalHours += weeklyHours;
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
    const packages = await this.packageService.getAllNotEndedYet(user);
    const crossSection: CrossSection = {
      totalHours: 0,
      localities: [],
      services: [],
    };
    for (const pkg of packages) {
      const weeklyHours = pkg.details.weeklyHours;
      crossSection.totalHours += weeklyHours;
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
  }

  async generateRequestsReport(
    user: User,
    startYear: number = firstYear
  ): Promise<Report> {
    // construct empty report
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentYear = parseInt(currentDate.slice(0, 4));
    const requests = await this.requestService.getAllMetadata(user, startYear);
    const report = this.constructEmptyReport(startYear, currentYear);
    // iterate through requests => for each find start date, end date, weekly hours, locality, service
    for (const request of requests) {
      this.addItemToReport(request, report);
    }
    return report;
  }

  async generatePackagesReport(
    user: User,
    startYear: number = firstYear
  ): Promise<Report> {
    // construct empty report
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentYear = parseInt(currentDate.slice(0, 4));
    const packages = await this.packageService.getAll(user, startYear);
    const report = this.constructEmptyReport(startYear, currentYear);
    // iterate through packages => for each find start date, end date, weekly hours, locality, service
    for (const pkg of packages) {
      this.addItemToReport(pkg, report);
    }
    return report;
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
  private addItemToReport(
    item: RequestMetadata | Package,
    report: Report
  ): void {
    const startDate = item.startDate;
    const endDate =
      item.endDate === "open"
        ? new Date().toISOString().slice(0, 10)
        : item.endDate;
    const startYear = parseInt(item.startDate.slice(0, 4));
    const startMonth = parseInt(item.startDate.slice(5, 7));
    const startDay = parseInt(item.startDate.slice(8, 10));
    const endYear = parseInt(endDate.slice(0, 4));
    const endMonth = parseInt(endDate.slice(5, 7));
    const endDay = parseInt(endDate.slice(8, 10));
    let currentDay = startDay;
    let currentMonth = startMonth;
    let currentYear = startYear;
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
    const hoursToAdd = item.details.weeklyHours * (endDay - currentDay / 7);
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
    reportYear.totalHours += hours;
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
    reportMonth.totalHours += hours;
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
        totalHours: hours,
        services: [],
      };
      reportLocalities.push(reportLocality);
    } else {
      reportLocality.totalHours += hours;
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
            totalHours: hours,
          });
        } else {
          reportService.totalHours += hours;
        }
      } else {
        const otherService = reportServices.find((s) => s.name == "Other");
        if (otherService) {
          otherService.totalHours += hours;
        } else {
          reportServices.push({
            name: "Other",
            totalHours: hours,
          });
        }
      }
    }
  }
}
