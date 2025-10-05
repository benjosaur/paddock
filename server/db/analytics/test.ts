import { sampleUser } from "../../utils/test";
import { ReportService } from "./service";

const reportService = new ReportService();

export async function testReportService() {
  try {
    console.log("Testing Report Service...\n");

    console.log("1. Generating requests report...");
    const requestsReport = await reportService.generateRequestsReport(
      sampleUser,
      false
    );
    console.log("Generated requests report:", requestsReport);

    console.log("\n2. Generating packages report...");
    const packagesReport = await reportService.generatePackagesReport(
      sampleUser
    );
    console.log("Generated packages report:", packagesReport);

    console.log("\n3. Generating active requests cross section...");
    const activeRequestsCrossSection =
      await reportService.generateActiveRequestsCrossSection(sampleUser);
    console.log(
      "Generated active requests cross section:",
      activeRequestsCrossSection
    );

    console.log("\n4. Generating active packages cross section...");
    const activePackagesCrossSection =
      await reportService.generateActivePackagesCrossSection(sampleUser);
    console.log(
      "Generated active packages cross section:",
      activePackagesCrossSection
    );

    console.log("\nAll tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run test only if this file is executed directly
if (require.main === module) {
  testReportService();
}
