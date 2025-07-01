import { TrainingRecordService } from "./service";
import { TrainingRecord } from "shared";

const trainingRecordService = new TrainingRecordService();

const sampleTrainingRecord: Omit<TrainingRecord, "id"> = {
  owner: "mp",
  recordName: "First Aid Certification",
  recordExpiry: "2025-12-31T23:59:59.000Z",
};

const ownerId = "mp#test-owner-123";
const ownerName = "Josh Walker";

async function testTrainingRecordService() {
  try {
    console.log("Testing Training Record Service...");

    console.log("1. Creating training record...");
    const createdRecord = await trainingRecordService.create(
      ownerId,
      ownerName,
      sampleTrainingRecord
    );
    console.log("Created training record:", createdRecord);

    console.log("2. Updating training record...");
    const updatedRecordData: TrainingRecord = {
      ...createdRecord,
      recordName: "Updated First Aid Certification",
      recordExpiry: "2026-12-31T23:59:59.000Z",
    };
    const updatedRecord = await trainingRecordService.update(
      ownerId,
      ownerName,
      updatedRecordData
    );
    console.log("Updated training record:", updatedRecord);

    console.log("3. Getting all training records...");
    const allRecords = await trainingRecordService.getAll();
    console.log("All training records:", allRecords);

    console.log("4. Getting training records expiring before 2026-06-01...");
    const expiringRecords = await trainingRecordService.getByExpiringBefore(
      "2026-06-01T00:00:00.000Z"
    );
    console.log("Expiring training records:", expiringRecords);

    console.log("5. Deleting training record...");
    const deletedCount = await trainingRecordService.delete(
      ownerId,
      createdRecord.id
    );
    console.log("Deleted count:", deletedCount);

    console.log("Training Record Service tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testTrainingRecordService();
