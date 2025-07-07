import { sampleUser } from "../test";
import { ClientService } from "./service";
import { ClientFull } from "shared";

const clientService = new ClientService();

const sampleClient: Omit<ClientFull, "id"> = {
  dateOfBirth: "1990-01-15",
  postCode: "SW1A 1AA",
  details: {
    name: "John Doe",
    address: "123 Test Street, London",
    phone: "07123456789",
    email: "john.doe@example.com",
    nextOfKin: "Jane Doe (Spouse) - 07987654321",
    needs: ["Mobility support", "Medication reminders"],
    services: ["Home visits", "Telephone support"],
    notes: "Regular check-ups required. Diabetes management.",
    referredBy: "GP Surgery",
    clientAgreementDate: "2024-01-01",
    clientAgreementComments: "All terms agreed",
    riskAssessmentDate: "2024-01-01",
    riskAssessmentComments: "Low risk assessment completed",
    attendanceAllowance: "yes",
    attendsMag: true,
  },
  mpRequests: [],
  volunteerRequests: [],
  mpLogs: [],
  volunteerLogs: [],
  magLogs: [],
};

export async function testClientService() {
  try {
    console.log("Testing Client Service...\n");

    console.log("1. Creating client...");
    const createdClient = await clientService.create(sampleClient, sampleUser);
    console.log("Created client:", createdClient.id);

    console.log("\n2. Getting client by ID...");
    const retrievedClient = await clientService.getById(
      sampleUser,
      createdClient.id
    );
    console.log("Retrieved client:", retrievedClient.details.name);

    console.log("\n3. Getting all clients...");
    const allClients = await clientService.getAll(sampleUser);
    console.log("Total clients:", allClients.length);

    console.log("\n4. Updating client...");
    const updatedClientData: ClientFull = {
      ...retrievedClient,
      details: {
        ...retrievedClient.details,
        phone: "07999888777",
      },
    };
    const updatedClient = await clientService.update(
      updatedClientData,
      sampleUser
    );
    console.log("Updated client phone:", updatedClient.details.phone);

    console.log("\n5. Deleting client...");
    const deletedCount = await clientService.delete(
      sampleUser,
      createdClient.id
    );
    console.log("Deleted items count:", deletedCount[0]);

    console.log("\nAll tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testClientService();
