import { TrainingRecord, trainingRecordSchema } from "shared";
import { TrainingRecordRepository } from "./repository";
import { DbTrainingRecordEntity } from "./schema";

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

  async create(record: Omit<TrainingRecord, "id">): Promise<TrainingRecord> {
    try {
      const recordToCreate: Omit<DbTrainingRecordEntity, "sK"> = {
        pK: record.ownerId,
        entityType: "trainingRecord",
        entityOwner: record.ownerId[0] == "v" ? "volunteer" : "mp",
        recordName: record.recordName,
        recordExpiry: record.recordExpiry,
        details: record.details,
      };
      const createdRecord = await this.trainingRecordRepository.create(
        recordToCreate
      );
      const transformedRecord =
        this.transformDbTrainingRecordToShared(createdRecord);
      const parsedResult = trainingRecordSchema
        .array()
        .parse(transformedRecord);
      return parsedResult[0];
    } catch (error) {
      console.error("Service Layer Error creating training record:", error);
      throw error;
    }
  }
  async update(record: TrainingRecord): Promise<TrainingRecord> {
    try {
      const dbRecord: DbTrainingRecordEntity = {
        pK: record.ownerId,
        sK: record.id,
        entityType: "trainingRecord",
        entityOwner: record.ownerId[0] == "v" ? "volunteer" : "mp",
        recordName: record.recordName,
        recordExpiry: record.recordExpiry,
        details: record.details,
      };

      const updatedRecord = await this.trainingRecordRepository.update(
        dbRecord
      );
      const transformedRecord =
        this.transformDbTrainingRecordToShared(updatedRecord);
      const parsedResult = trainingRecordSchema
        .array()
        .parse(transformedRecord);
      return parsedResult[0];
    } catch (error) {
      console.error("Service Layer Error updating training record:", error);
      throw error;
    }
  }

  async delete(ownerId: string, recordId: string): Promise<number[]> {
    try {
      const deletedCount = await this.trainingRecordRepository.delete(
        ownerId,
        recordId
      );
      return deletedCount;
    } catch (error) {
      console.error("Service Layer Error deleting training record:", error);
      throw error;
    }
  }

  private transformDbTrainingRecordToShared(
    items: DbTrainingRecordEntity[]
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
          trainingRecord.ownerId = item.pK;
          trainingRecord.recordName = item.recordName;
          trainingRecord.recordExpiry = item.recordExpiry;
          trainingRecord.details = item.details;
          break;
        default:
          throw new Error(`Undefined Case: ${item}`);
      }
    }
    return Array.from(trainingRecordsMap.values()) as TrainingRecord[];
  }
}
