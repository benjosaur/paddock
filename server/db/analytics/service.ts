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

import { firstYear } from "shared/const";
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
  AttendanceAllowanceCrossSection,
} from "shared";
import { ClientService } from "../client/service";
import { VolunteerService } from "../volunteer/service";
import { NormalReportService } from "./normal/service";
import { DeprivationReportService } from "./deprivation/service";
import { AttendanceReportService } from "./attendance/service";

// Facade service keeps API stable and delegates to sub-services

export class ReportService {
  // Keep references if needed elsewhere in app
  clientService = new ClientService();
  requestService = new RequestService();
  packageService = new PackageService();
  volunteerService = new VolunteerService();

  normal = new NormalReportService();
  deprivation = new DeprivationReportService();
  attendance = new AttendanceReportService();

  // children

  async generateAttendanceAllowanceCrossSection(
    user: User
  ): Promise<AttendanceAllowanceCrossSection> {
    try {
      return await this.attendance.generateAttendanceAllowanceCrossSection(
        user
      );
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
      return await this.normal.generateActiveRequestsCrossSection(user);
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
      return await this.normal.generateActivePackagesCrossSection(user);
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
      return await this.deprivation.generateActiveRequestsDeprivationCrossSection(
        user
      );
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
      return await this.deprivation.generateActivePackagesDeprivationCrossSection(
        user
      );
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
      return await this.normal.generateRequestsReport(user, isInfo, startYear);
    } catch (error) {
      console.error("Service Layer Error generating requests report:", error);
      throw error;
    }
  }

  async generatePackagesReport(
    user: User,
    startYear: number = firstYear,
    isInfo: boolean = false
  ): Promise<Report> {
    try {
      return await this.normal.generatePackagesReport(user, startYear, isInfo);
    } catch (error) {
      console.error("Service Layer Error generating packages report:", error);
      throw error;
    }
  }

  async generateCoordinatorReport(
    user: User,
    startYear: number = firstYear,
    isInfo: boolean = true
  ): Promise<Report> {
    try {
      return await this.normal.generateCoordinatorReport(
        user,
        startYear,
        isInfo
      );
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
      return await this.deprivation.generateRequestsDeprivationReport(
        user,
        isInfo,
        startYear
      );
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
    startYear: number = firstYear,
    isInfo: boolean = false
  ): Promise<DeprivationReport> {
    try {
      return await this.deprivation.generatePackagesDeprivationReport(
        user,
        startYear,
        isInfo
      );
    } catch (error) {
      console.error(
        "Service Layer Error generating packages deprivation report:",
        error
      );
      throw error;
    }
  }
  // All implementation details now live in sub-services
}
