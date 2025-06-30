import { MpService } from "./service";
import { MpMetadata } from "shared";

const mpService = new MpService();

const sampleMp: Omit<MpMetadata, "id"> = {
  dateOfBirth: "1990-01-01",
  postCode: "SW1A 1AA",
  recordName: "First Aid",
  recordExpiry: "2025-12-31T00:00:00.000Z",
  trainingRecords: [],
  details: {
    name: "John Smith",
    address: "House of Commons, Westminster",
    email: "john.smith@parliament.uk",
    phone: "020 7219 3000",
    nextOfKin: "Jane Smith",
    needs: [],
    services: [],
    notes: "MP for Westminster",
    specialisms: ["Health", "Education"],
    transport: true,
    capacity: "Full time",
  },
};

async function testMpService() {
  try {
    console.log("Testing MP Service...");

    console.log("1. Creating MP...");
    const createdMp = await mpService.create(sampleMp);
    console.log("Created MP:", createdMp);

    console.log("2. Getting MP by ID...");
    const retrievedMp = await mpService.getById(createdMp.id);
    console.log("Retrieved MP:", retrievedMp);

    console.log("3. Updating MP...");
    const updatedMpData: MpMetadata = {
      ...retrievedMp,
      details: {
        ...retrievedMp.details,
        notes: "Updated MP for Westminster",
      },
    };
    const updatedMp = await mpService.update(updatedMpData);
    console.log("Updated MP:", updatedMp);

    console.log("4. Getting all MPs...");
    const allMps = await mpService.getAll();
    console.log("All MPs:", allMps);

    console.log("5. Deleting MP...");
    const deletedCount = await mpService.delete(createdMp.id);
    console.log("Deleted count:", deletedCount);

    console.log("MP Service tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testMpService();
