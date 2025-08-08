import { sampleUser } from "../../utils/test";
import { MpService } from "./service";
import { MpMetadata } from "shared";

const mpService = new MpService();

const sampleMp: Omit<MpMetadata, "id"> = {
  archived: "N",
  dateOfBirth: "1990-01-01",
  dbsExpiry: "2025-12-31",
  publicLiabilityExpiry: "2025-12-31",
  trainingRecords: [],
  details: {
    name: "John Smith",
    address: {
      streetAddress: "House of Commons",
      locality: "Ashbrittle",
      county: "London",
      postCode: "SW1A 1AA",
    },
    email: "john.smith@parliament.uk",
    phone: "020 7219 3000",
    nextOfKin: "Jane Smith",
    services: [],
    attendsMag: false,
    notes: [
      {
        date: "2025-07-21",
        note: "MP for Westminster",
        source: "In Person",
        minutesTaken: 2.0,
      },
    ],
    capacity: "Full time",
  },
  packages: [],
};

export async function testMpService() {
  try {
    console.log("Testing MP Service...");

    console.log("1. Creating MP...");
    const createdMpId = await mpService.create(sampleMp, sampleUser);
    console.log("Created MP ID:", createdMpId);

    console.log("2. Getting MP by ID...");
    const retrievedMp = await mpService.getById(createdMpId, sampleUser);
    console.log("Retrieved MP:", retrievedMp);

    console.log("3. Updating MP...");
    const updatedMpData: MpMetadata = {
      id: retrievedMp.id,
      archived: retrievedMp.archived,
      dateOfBirth: retrievedMp.dateOfBirth,
      dbsExpiry: retrievedMp.dbsExpiry,
      publicLiabilityExpiry: retrievedMp.publicLiabilityExpiry,
      trainingRecords: retrievedMp.trainingRecords,
      packages: [], // MpMetadata requires packages, MpFull has requests instead
      details: {
        ...retrievedMp.details,
        notes: [
          ...retrievedMp.details.notes,
          {
            date: "2025-07-21",
            note: "Updated MP for Westminster",
            source: "Phone",
            minutesTaken: 0.75,
          },
        ],
      },
    };
    const updatedMp = await mpService.update(updatedMpData, sampleUser);
    console.log("Updated MP:", updatedMp);

    console.log("4. Getting all MPs...");
    const allMps = await mpService.getAll(sampleUser);
    console.log("All MPs:", allMps);

    console.log("5. Deleting MP...");
    const deletedCount = await mpService.delete(sampleUser, createdMpId);
    console.log("Deleted count:", deletedCount);

    console.log("MP Service tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run test only if this file is executed directly
if (require.main === module) {
  testMpService();
}
