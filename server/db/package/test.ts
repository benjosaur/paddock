import { Package } from "shared";
import { PackageService } from "./service";
import { sampleUser } from "../../utils/test";

const packageService = new PackageService();

const samplePackage: Omit<Package, "id"> = {
  carerId: "mp#test-carer-123",
  archived: "N",
  requestId: "request#test-request-456",
  startDate: "2025-01-15",
  endDate: "2025-12-31",
  details: {
    name: "John Smith",
    address: {
      streetAddress: "61626 Schmidt Divide",
      locality: "Bathealton",
      county: "Somerset",
      postCode: "TA4 2PJ",
      deprivation: {
        income: false,
        health: false,
      },
    },
    weeklyHours: 10,
    notes: "Weekly support visits including shopping and companionship",
    services: ["Attendance Allowance"],
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
          locality: "Bathealton",
          county: "Somerset",
          postCode: "TA4 2PJ",
          deprivation: {
            income: false,
            health: false,
          },
        },
        weeklyHours: 15,
        notes:
          "Extended weekly support visits including shopping, companionship, and medical appointments",
        services: ["Companionship"],
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

    console.log("7. Testing renew function...");
    // First, update the old package with an end date (similar to frontend logic)
    const oldPackageWithEndDate: Package = {
      ...fetchedPackage,
      endDate: "2025-01-31",
    };

    const renewedPackageData: Omit<Package, "id"> = {
      carerId: fetchedPackage.carerId,
      archived: "N",
      requestId: fetchedPackage.requestId,
      startDate: "2025-02-01",
      endDate: "open",
      details: {
        name: "John Smith",
        address: {
          streetAddress: "61626 Schmidt Divide",
          locality: "Bathealton",
          county: "Somerset",
          postCode: "TA4 2PJ",
          deprivation: {
            income: false,
            health: false,
          },
        },
        weeklyHours: 12,
        notes: "Renewed package with updated weekly hours",
        services: ["Companionship", "Attendance Allowance"],
      },
    };

    const renewedPackageId = await packageService.renew(
      oldPackageWithEndDate,
      renewedPackageData,
      sampleUser
    );
    console.log("Renewed package ID:", renewedPackageId);

    console.log("8. Verifying renewal - checking old package is ended...");
    const oldPackageAfterRenewal = await packageService.getById(
      createdPackageId,
      sampleUser
    );
    console.log("Old package end date:", oldPackageAfterRenewal.endDate);

    console.log("9. Verifying renewal - checking new package exists...");
    const newPackageAfterRenewal = await packageService.getById(
      renewedPackageId,
      sampleUser
    );
    console.log("New package start date:", newPackageAfterRenewal.startDate);
    console.log("New package end date:", newPackageAfterRenewal.endDate);
    console.log(
      "New package weekly hours:",
      newPackageAfterRenewal.details.weeklyHours
    );

    console.log("10. Testing second renew function...");
    // Get the first renewed package and set its end date
    const firstRenewedPackage = await packageService.getById(
      renewedPackageId,
      sampleUser
    );
    const firstRenewedWithEndDate: Package = {
      ...firstRenewedPackage,
      endDate: "2025-02-28",
    };

    const secondRenewedPackageData: Omit<Package, "id"> = {
      carerId: fetchedPackage.carerId,
      archived: "N",
      requestId: fetchedPackage.requestId,
      startDate: "2025-03-01",
      endDate: "open",
      details: {
        name: "John Smith",
        address: {
          streetAddress: "61626 Schmidt Divide",
          locality: "Bathealton",
          county: "Somerset",
          postCode: "TA4 2PJ",
          deprivation: {
            income: false,
            health: false,
          },
        },
        weeklyHours: 8,
        notes: "Second renewal with updated hours",
        services: ["Companionship"],
      },
    };

    const secondRenewedPackageId = await packageService.renew(
      firstRenewedWithEndDate,
      secondRenewedPackageData,
      sampleUser
    );
    console.log("Second renewed package ID:", secondRenewedPackageId);

    console.log("11. Cleanup - Deleting all test packages...");
    const deletedCount1 = await packageService.delete(
      sampleUser,
      createdPackageId
    );
    console.log("Deleted original package count:", deletedCount1);

    const deletedCount2 = await packageService.delete(
      sampleUser,
      renewedPackageId
    );
    console.log("Deleted first renewed package count:", deletedCount2);

    const deletedCount3 = await packageService.delete(
      sampleUser,
      secondRenewedPackageId
    );
    console.log("Deleted second renewed package count:", deletedCount3);

    console.log("Package Service tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run test only if this file is executed directly
if (require.main === module) {
  testPackageService();
}
