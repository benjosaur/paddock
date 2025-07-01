import { RequestService } from "./service";
import type { ClientRequest } from "./service";

const requestService = new RequestService();

const sampleMpRequest: Omit<ClientRequest, "id"> = {
  date: "ASAP",
  details: { notes: "Urgent MP support needed" },
};

const sampleVolunteerRequest: Omit<ClientRequest, "id"> = {
  date: "2025-01-15",
  details: { notes: "Weekly volunteer visit requested" },
};

const clientId = "c#test-client-123";
const clientName = "Test Client";

async function testRequestService() {
  try {
    console.log("Testing Request Service...");

    console.log("1. Creating MP request...");
    const createdMpRequest = await requestService.create(
      clientId,
      clientName,
      sampleMpRequest,
      "clientMpRequest"
    );
    console.log("Created MP request:", createdMpRequest);

    console.log("2. Creating volunteer request...");
    const createdVolunteerRequest = await requestService.create(
      clientId,
      clientName,
      sampleVolunteerRequest,
      "clientVolunteerRequest"
    );
    console.log("Created volunteer request:", createdVolunteerRequest);

    console.log("3. Getting requests by client ID...");
    const clientRequests = await requestService.getByClientId(clientId);
    console.log("Client requests:", clientRequests);

    console.log("4. Updating MP request...");
    const updatedMpRequestData: ClientRequest = {
      ...createdMpRequest,
      details: { notes: "Updated MP support requirements" },
    };
    const updatedMpRequest = await requestService.update(
      clientId,
      clientName,
      updatedMpRequestData,
      "clientMpRequest"
    );
    console.log("Updated MP request:", updatedMpRequest);

    console.log("5. Getting all requests...");
    const allRequests = await requestService.getAll();
    console.log("All requests:", allRequests);

    console.log("6. Getting requests before 2025-02-01...");
    const requestsBefore = await requestService.getByStartDateBefore(
      "2025-02-01"
    );
    console.log("Requests before 2025-02-01:", requestsBefore);

    console.log("7. Deleting MP request...");
    const deletedMpCount = await requestService.delete(
      clientId,
      createdMpRequest.id
    );
    console.log("Deleted MP request count:", deletedMpCount);

    console.log("8. Deleting volunteer request...");
    const deletedVolunteerCount = await requestService.delete(
      clientId,
      createdVolunteerRequest.id
    );
    console.log("Deleted volunteer request count:", deletedVolunteerCount);

    console.log("Request Service tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testRequestService();
