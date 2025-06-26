import { TrainingRecord, trainingRecordSchema } from "shared";
import { TrainingRecordRepository } from "./repository";
import { DbTrainingRecord } from "./schema";

export class TrainingRecordService {
  trainingRecordRepository = new TrainingRecordRepository();
  async getAll(): Promise<TrainingRecord[]> {
    const trainingRecordsFromDb = await this.trainingRecordRepository.getAll();
    const transformedRecords = this.transformDbTrainingRecordToShared(
      trainingRecordsFromDb
    ) as TrainingRecord[];
    const parsedResult = trainingRecordSchema.array().parse(transformedRecords);
    return parsedResult;
  }

  async getByExpiringBefore(expiryDate: string): Promise<TrainingRecord[]> {
    const trainingRecordFromDb =
      await this.trainingRecordRepository.getByExpiringBefore(expiryDate);
    const transformedRecords = this.transformDbTrainingRecordToShared(
      trainingRecordFromDb
    ) as TrainingRecord[];
    const parsedResult = trainingRecordSchema.array().parse(transformedRecords);
    return parsedResult;
  }

  private transformDbTrainingRecordToShared(
    items: DbTrainingRecord[]
  ): TrainingRecord[] {
    const trainingRecordsMap = new Map<string, Partial<TrainingRecord>>();

    for (const item of items) {
      const trainingRecordId = item.sK;

      if (!trainingRecordsMap.has(trainingRecordId)) {
        trainingRecordsMap.set(trainingRecordId, {
          id: trainingRecordId,
        });
      }

      const trainingRecord = trainingRecordsMap.get(trainingRecordId)!;

      switch (item.entityType) {
        case "trainingRecord":
          trainingRecord.id = item.sK;
          trainingRecord.owner = item.entityOwner;
          trainingRecord.recordName = item.recordName;
          trainingRecord.recordExpiry = item.recordExpiry;
          break;
        default:
          throw new Error(`Undefined Case: ${item}`);
      }
    }
    return Array.from(trainingRecordsMap.values()) as TrainingRecord[];
  }
}
