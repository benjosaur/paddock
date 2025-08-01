import { sampleUser } from "../../utils/test";
import { ClientService } from "./service";
import { ClientFull } from "shared";

const clientService = new ClientService();

const sampleClient: Omit<ClientFull, "id"> = {
  archived: "N",
  dateOfBirth: "1990-01-15",
  details: {
    name: "John Doe",
    address: {
      streetAddress: "61626 Schmidt Divide",
      locality: "Wiveliscombe",
      county: "Somerset",
      postCode: "TA4 2PJ",
      deprivation: {
        income: false,
        health: false,
      },
    },
    phone: "07123456789",
    email: "john.doe@example.com",
    nextOfKin: "Jane Doe (Spouse) - 07987654321",
    services: ["Domestic"],
    notes: [
      {
        date: "2024-01-01",
        note: "Regular check-ups required. Diabetes management.",
      },
    ],
    donationScheme: true,
    donationAmount: 10,
    referredBy: "GP Surgery",
    clientAgreementDate: "2024-01-01",
    clientAgreementComments: "All terms agreed",
    riskAssessmentDate: "2024-01-01",
    riskAssessmentComments: "Low risk assessment completed",
    attendanceAllowance: "yes",
    attendsMag: true,
  },
  requests: [],
  magLogs: [],
};

export async function testClientService() {
  try {
    console.log("Testing Client Service...\n");

    console.log("1. Creating client...");
    const createdClientId = await clientService.create(
      sampleClient,
      sampleUser
    );
    console.log("Created client:", createdClientId);

    console.log("\n2. Getting client by ID...");
    const retrievedClient = await clientService.getById(
      createdClientId,
      sampleUser
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
    await clientService.update(updatedClientData, sampleUser);
    console.log("Updated client phone:", updatedClientData.details.phone);

    console.log("\n5. Deleting client...");
    const deletedCount = await clientService.delete(
      sampleUser,
      createdClientId
    );
    console.log("Deleted items count:", deletedCount[0]);

    console.log("\nAll tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run test only if this file is executed directly
if (require.main === module) {
  testClientService();
}
