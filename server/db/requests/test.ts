import { sampleUser } from "../test";
import { RequestService } from "./service";
import { ClientRequest } from "shared";

const requestService = new RequestService();

const sampleMpRequest: Omit<ClientRequest, "id"> = {
  clientId: "c#test-client-123",
  requestType: "mp",
  startDate: "2025-01-10",
  details: {
    name: "Test Client",
    notes: "Urgent MP support needed",
    schedule: "Once a week",
    status: "urgent",
  },
};

const sampleVolunteerRequest: Omit<ClientRequest, "id"> = {
  clientId: "c#test-client-123",
  requestType: "volunteer",
  startDate: "2025-01-15",
  details: {
    name: "Test Client",
    notes: "Weekly volunteer visit requested",
    schedule: "Once a week",
    status: "pending",
  },
};

const clientId = "c#test-client-123";

export async function testRequestService() {
  try {
    console.log("Testing Request Service...");

    console.log("1. Creating MP request...");
    const createdMpRequest = await requestService.create(
      sampleMpRequest,
      sampleUser
    );
    console.log("Created MP request:", createdMpRequest);

    console.log("2. Creating volunteer request...");
    const createdVolunteerRequest = await requestService.create(
      sampleVolunteerRequest,
      sampleUser
    );
    console.log("Created volunteer request:", createdVolunteerRequest);

    console.log("3. Getting requests by client ID...");
    const clientRequests = await requestService.getByClientId(
      sampleUser,
      clientId
    );
    console.log("Client requests:", clientRequests);

    console.log("4. Updating MP request...");
    const updatedMpRequestData: ClientRequest = {
      ...createdMpRequest,
      details: {
        name: "Test Client",
        notes: "Updated MP support requirements",
        schedule: "Once a week",
        status: "pending",
      },
    };
    const updatedMpRequest = await requestService.update(
      updatedMpRequestData,
      sampleUser
    );
    console.log("Updated MP request:", updatedMpRequest);

    console.log("5. Getting all requests...");
    const allRequests = await requestService.getAll(sampleUser);
    console.log("All requests:", allRequests);

    console.log("6. Getting requests before 2025-02-01...");
    const requestsBefore = await requestService.getByStartDateBefore(
      sampleUser,
      "2025-02-01"
    );
    console.log("Requests before 2025-02-01:", requestsBefore);

    console.log("7. Deleting MP request...");
    const deletedMpCount = await requestService.delete(
      sampleUser,
      clientId,
      createdMpRequest.id
    );
    console.log("Deleted MP request count:", deletedMpCount);

    console.log("8. Deleting volunteer request...");
    const deletedVolunteerCount = await requestService.delete(
      sampleUser,
      clientId,
      createdVolunteerRequest.id
    );
    console.log("Deleted volunteer request count:", deletedVolunteerCount);

    console.log("Request Service tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run test only if this file is executed directly
if (require.main === module) {
  testRequestService();
}
