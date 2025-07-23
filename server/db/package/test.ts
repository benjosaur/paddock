import { Package } from "shared";
import { PackageService } from "./service";
import { sampleUser } from "../../utils/test";

const packageService = new PackageService();

const samplePackage: Omit<Package, "id"> = {
  carerId: "mp#test-carer-123",
  requestId: "request#test-request-456",
  startDate: "2025-01-15",
  endDate: "2025-12-31",
  details: {
    name: "John Smith",
    address: {
      streetAddress: "61626 Schmidt Divide",
      locality: "Bishops Lydeard",
      county: "Somerset",
      postCode: "TA4 2PJ",
    },
    weeklyHours: 10,
    notes: "Weekly support visits including shopping and companionship",
    services: ["companionship", "shopping", "transport"],
  },
};

export async function testPackageService() {
  try {
    console.log("Testing Package Service...");

    console.log("1. Creating package...");
    const createdPackageId = await packageService.create(
      samplePackage,
      sampleUser
    );
    console.log("Created package ID:", createdPackageId);

    console.log("2. Getting package by ID...");
    const fetchedPackage = await packageService.getById(
      createdPackageId,
      sampleUser
    );
    console.log("Fetched package:", fetchedPackage);

    console.log("3. Updating package...");
    const updatedPackageData: Package = {
      ...fetchedPackage,
      details: {
        name: "John Smith",
        address: {
          streetAddress: "61626 Schmidt Divide",
          locality: "Bishops Lydeard",
          county: "Somerset",
          postCode: "TA4 2PJ",
        },
        weeklyHours: 15,
        notes:
          "Extended weekly support visits including shopping, companionship, and medical appointments",
        services: ["companionship", "shopping", "transport", "medical-support"],
      },
    };
    await packageService.update(updatedPackageData, sampleUser);
    console.log("Updated package successfully");

    console.log("4. Getting all packages...");
    const allPackages = await packageService.getAll(sampleUser);
    console.log("All packages:", allPackages);

    console.log("5. Getting all active packages...");
    const activePackages = await packageService.getAllNotArchived(sampleUser);
    console.log("Active packages:", activePackages);

    console.log("6. Getting all open packages...");
    const openPackages = await packageService.getAllNotEndedYet(sampleUser);
    console.log("Open packages:", openPackages);

    console.log("7. Deleting package...");
    const deletedCount = await packageService.delete(
      sampleUser,
      createdPackageId
    );
    console.log("Deleted count:", deletedCount);

    console.log("Package Service tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run test only if this file is executed directly
if (require.main === module) {
  testPackageService();
}
