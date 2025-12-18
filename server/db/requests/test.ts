// import { sampleUser } from "../../utils/test";
// import { RequestService } from "./service";
// import { PackageService } from "../package/service";
// import { RequestMetadata, Package } from "shared";

// const requestService = new RequestService();
// const packageService = new PackageService();

// const samplePaidRequest: Omit<RequestMetadata, "id"> = {
//   clientId: "c#test-client-123",
//   requestType: "paid",
//   startDate: "2025-01-10",
//   endDate: "open",
//   details: {
//     customId: "",
//     name: "Test Client",
//     notes: "Urgent paid support needed",
//     address: {
//       streetAddress: "61626 Schmidt Divide",
//       locality: "Wiveliscombe",
//       county: "Somerset",
//       postCode: "TA4 2PJ",
//       deprivation: {
//         income: false,
//         health: false,
//       },
//     },
//     services: ["Companionship", "Attendance Allowance"],
//     weeklyHours: 10,
//     oneOffStartDateHours: 0,
//     status: "urgent",
//   },
// };

// const sampleUnpaidRequest: Omit<RequestMetadata, "id"> = {
//   clientId: "c#test-client-123",
//   requestType: "unpaid",
//   startDate: "2025-01-15",
//   endDate: "open",
//   details: {
//     customId: "",
//     name: "Test Client",
//     address: {
//       streetAddress: "61626 Schmidt Divide",
//       locality: "Brompton Ralph",
//       county: "Somerset",
//       postCode: "TA4 2PJ",
//       deprivation: {
//         income: false,
//         health: false,
//       },
//     },
//     services: ["Companionship", "Attendance Allowance"],
//     notes: "Weekly unpaid volunteer visit requested",
//     weeklyHours: 5,
//     oneOffStartDateHours: 0,
//     status: "normal",
//   },
// };

// export async function testRequestService() {
//   try {
//     console.log("Testing Request Service...");

//     console.log("1. Creating paid request...");
//     const createdPaidRequestId = await requestService.create(
//       samplePaidRequest,
//       sampleUser
//     );
//     console.log("Created paid request ID:", createdPaidRequestId);

//     console.log("2. Creating unpaid request...");
//     const createdUnpaidRequestId = await requestService.create(
//       sampleUnpaidRequest,
//       sampleUser
//     );
//     console.log("Created unpaid request ID:", createdUnpaidRequestId);

//     console.log("3. Creating packages for paid request...");
//     const samplePackage1: Omit<Package, "id"> = {
//       carerId: "carer-123",
//       requestId: createdPaidRequestId,
//       startDate: "2025-01-15",
//       endDate: "open",
//       details: {
//         name: "John Carer",
//         weeklyHours: 5,
//         oneOffStartDateHours: 0,
//         address: {
//           streetAddress: "123 Test Street",
//           locality: "Wiveliscombe",
//           county: "Somerset",
//           postCode: "TA1 1AA",
//           deprivation: {
//             income: false,
//             health: false,
//           },
//         },
//         notes: "Test package 1",
//         services: ["Companionship"],
//       },
//     };

//     const samplePackage2: Omit<Package, "id"> = {
//       carerId: "carer-456",
//       requestId: createdPaidRequestId,
//       startDate: "2025-01-20",
//       endDate: "open",
//       details: {
//         name: "Jane Carer",
//         weeklyHours: 3,
//         oneOffStartDateHours: 0,
//         address: {
//           streetAddress: "456 Test Avenue",
//           locality: "Brompton Ralph",
//           county: "Somerset",
//           postCode: "TA2 2BB",
//           deprivation: {
//             income: true,
//             health: false,
//           },
//         },
//         notes: "Test package 2",
//         services: ["Attendance Allowance"],
//       },
//     };

//     const package1Id = await packageService.create(samplePackage1, sampleUser);
//     const package2Id = await packageService.create(samplePackage2, sampleUser);
//     console.log("Created package IDs:", package1Id, package2Id);

//     console.log("4. Getting request by ID with packages...");
//     const paidRequest = await requestService.getById(
//       createdPaidRequestId,
//       sampleUser
//     );
//     console.log("Paid request with packages:", paidRequest);

//     console.log("5. Updating paid request...");
//     const updatedPaidRequestData: RequestMetadata = {
//       ...paidRequest,
//       details: {
//         ...paidRequest.details,
//         notes: "Updated paid support requirements",
//         status: "normal",
//       },
//     };
//     await requestService.update(updatedPaidRequestData as any, sampleUser);
//     console.log("Updated paid request");

//     console.log("6. Testing renew function...");
//     // First, update the old request with an end date (as mentioned in the comment)
//     const oldRequestWithEndDate: RequestMetadata = {
//       ...paidRequest,
//       endDate: "2025-01-31",
//     };

//     const renewedRequestData: Omit<RequestMetadata, "id"> = {
//       clientId: paidRequest.clientId,
//       requestType: "paid",
//       startDate: "2025-02-01",
//       endDate: "open",
//       details: {
//         ...paidRequest.details,
//         notes: "Renewed request for 2025",
//         status: "normal",
//       },
//     };

//     await requestService.renew(
//       oldRequestWithEndDate,
//       renewedRequestData,
//       sampleUser
//     );
//     console.log("Successfully renewed request");

//     console.log("7. Verifying renewal - checking old request is ended...");
//     const oldRequestAfterRenewal = await requestService.getById(
//       createdPaidRequestId,
//       sampleUser
//     );
//     console.log("Old request end date:", oldRequestAfterRenewal.endDate);
//     console.log(
//       "Old request packages count:",
//       oldRequestAfterRenewal.packages?.length || 0
//     );

//     console.log("8. Getting all requests metadata...");
//     const allRequests = await requestService.getAllInfoMetadata(sampleUser);
//     console.log("Total requests after renewal:", allRequests.length);

//     // Find the new request (should have the old packages transferred)
//     const newRequest = allRequests.find(
//       (req: RequestMetadata) =>
//         req.startDate === "2025-02-01" &&
//         req.details.notes === "Renewed request for 2025"
//     );
//     if (newRequest) {
//       console.log("New request ID:", newRequest.id);

//       console.log("9. Verifying packages transferred to new request...");
//       const newRequestWithPackages = await requestService.getById(
//         newRequest.id,
//         sampleUser
//       );
//       console.log(
//         "New request packages count:",
//         newRequestWithPackages.packages?.length || 0
//       );
//       console.log("New request packages:", newRequestWithPackages.packages);
//     }

//     console.log("10. Getting all active requests with packages...");
//     const activeRequests =
//       await requestService.getAllWithoutInfoNotEndedYetWithPackages(sampleUser);
//     console.log("Active requests count:", activeRequests.length);

//     // skipping archive toggle as archived concept removed

//     console.log("12. Cleanup - Deleting all test requests...");
//     const deletedPaidCount = await requestService.delete(
//       sampleUser,
//       createdPaidRequestId
//     );
//     console.log("Deleted paid request count:", deletedPaidCount);

//     const deletedUnpaidCount = await requestService.delete(
//       sampleUser,
//       createdUnpaidRequestId
//     );
//     console.log("Deleted unpaid request count:", deletedUnpaidCount);

//     if (newRequest) {
//       const deletedRenewedCount = await requestService.delete(
//         sampleUser,
//         newRequest.id
//       );
//       console.log("Deleted renewed request count:", deletedRenewedCount);
//     }

//     console.log("Request Service tests completed successfully!");
//   } catch (error) {
//     console.error("Test failed:", error);
//   }
// }

// // Run test only if this file is executed directly (ESM/Bun)
// if (import.meta.main) {
//   testRequestService();
// }
