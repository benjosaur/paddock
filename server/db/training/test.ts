// import { sampleUser } from "../../utils/test";
// import { TrainingRecordService } from "./service";
// import { TrainingRecord } from "shared";

// const trainingRecordService = new TrainingRecordService();

// const sampleTrainingRecord: Omit<TrainingRecord, "id"> = {
//   ownerId: "mp#test-owner-123",
//   expiryDate: "2025-12-31",
//   endDate: "open",
//   details: {
//     name: "Robert Branson",
//     recordName: "First Aid Certification",
//     recordNumber: "",
//     notes: "",
//   },
// };

// export async function testTrainingRecordService() {
//   try {
//     console.log("Testing Training Record Service...");

//     console.log("1. Creating training record...");
//     const createdRecordId = await trainingRecordService.create(
//       sampleTrainingRecord,
//       sampleUser
//     );
//     console.log("Created training record ID:", createdRecordId);

//     console.log("2. Updating training record...");
//     const updatedRecordData: TrainingRecord = {
//       id: createdRecordId,
//       ownerId: sampleTrainingRecord.ownerId,
//       expiryDate: "2026-12-31",
//       endDate: "open",
//       details: {
//         name: "Robert Branson",
//         recordName: "Updated First Aid Certification",
//         recordNumber: "",
//         notes: "",
//       },
//     };
//     const updatedRecord = await trainingRecordService.update(
//       updatedRecordData,
//       sampleUser
//     );
//     console.log("Updated training record:", updatedRecord);

//     console.log("3. Getting all training records...");
//     const allRecords = await trainingRecordService.getAll(sampleUser);
//     console.log("All training records:", allRecords);

//     console.log("4. Getting training records expiring before 2026-06-01...");
//     const expiringRecords = await trainingRecordService.getByExpiringBefore(
//       sampleUser,
//       "2026-06-01"
//     );
//     console.log("Expiring training records:", expiringRecords);

//     console.log("5. Deleting training record...");
//     const deletedCount = await trainingRecordService.delete(
//       sampleUser,
//       sampleTrainingRecord.ownerId,
//       createdRecordId
//     );
//     console.log("Deleted count:", deletedCount);

//     console.log("Training Record Service tests completed successfully!");
//   } catch (error) {
//     console.error("Test failed:", error);
//   }
// }

// // Run test only if this file is executed directly (ESM/Bun)
// if (import.meta.main) {
//   testTrainingRecordService();
// }
