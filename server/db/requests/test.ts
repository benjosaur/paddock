import { sampleUser } from "../../utils/test";
import { RequestService } from "./service";
import { RequestMetadata } from "shared";

const requestService = new RequestService();

const samplePaidRequest: Omit<RequestMetadata, "id"> = {
  clientId: "c#test-client-123",
  archived: "N",
  requestType: "paid",
  startDate: "2025-01-10",
  endDate: "open",
  details: {
    name: "Test Client",
    notes: "Urgent paid support needed",
    address: {
      streetAddress: "61626 Schmidt Divide",
      locality: "Bishops Lydeard",
      county: "Somerset",
      postCode: "TA4 2PJ",
    },
    services: ["Befriending", "Attendance Allowance"],
    weeklyHours: 10,
    status: "urgent",
  },
};

const sampleUnpaidRequest: Omit<RequestMetadata, "id"> = {
  clientId: "c#test-client-123",
  archived: "N",
  requestType: "unpaid",
  startDate: "2025-01-15",
  endDate: "open",
  details: {
    name: "Test Client",
    address: {
      streetAddress: "61626 Schmidt Divide",
      locality: "Bishops Lydeard",
      county: "Somerset",
      postCode: "TA4 2PJ",
    },
    services: ["Befriending", "Attendance Allowance"],
    notes: "Weekly unpaid volunteer visit requested",
    weeklyHours: 5,
    status: "pending",
  },
};

export async function testRequestService() {
  try {
    console.log("Testing Request Service...");

    console.log("1. Creating paid request...");
    const createdPaidRequestId = await requestService.create(
      samplePaidRequest,
      sampleUser
    );
    console.log("Created paid request ID:", createdPaidRequestId);

    console.log("2. Creating unpaid request...");
    const createdUnpaidRequestId = await requestService.create(
      sampleUnpaidRequest,
      sampleUser
    );
    console.log("Created unpaid request ID:", createdUnpaidRequestId);

    console.log("3. Getting request by ID...");
    const paidRequest = await requestService.getById(
      createdPaidRequestId,
      sampleUser
    );
    console.log("Paid request:", paidRequest);

    console.log("4. Updating paid request...");
    const updatedPaidRequestData: RequestMetadata = {
      ...paidRequest,
      details: {
        ...paidRequest.details,
        notes: "Updated paid support requirements",
        status: "pending",
      },
    };
    await requestService.update(updatedPaidRequestData as any, sampleUser);
    console.log("Updated paid request");

    console.log("5. Getting all requests metadata...");
    const allRequests = await requestService.getAllMetadata(sampleUser);
    console.log("All requests:", allRequests);

    console.log("6. Getting all active requests with packages...");
    const activeRequests = await requestService.getAllNotArchivedWithPackages(
      sampleUser
    );
    console.log("Active requests:", activeRequests);

    console.log("7. Deleting paid request...");
    const deletedPaidCount = await requestService.delete(
      sampleUser,
      createdPaidRequestId
    );
    console.log("Deleted paid request count:", deletedPaidCount);

    console.log("8. Deleting unpaid request...");
    const deletedUnpaidCount = await requestService.delete(
      sampleUser,
      createdUnpaidRequestId
    );
    console.log("Deleted unpaid request count:", deletedUnpaidCount);

    console.log("Request Service tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run test only if this file is executed directly
if (require.main === module) {
  testRequestService();
}
