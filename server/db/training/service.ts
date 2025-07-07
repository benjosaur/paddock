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

  async getById(
    ownerId: string,
    recordId: string
  ): Promise<TrainingRecord | null> {
    const trainingRecordFromDb = await this.trainingRecordRepository.getById(
      ownerId,
      recordId
    );
    if (!trainingRecordFromDb) {
      return null;
    }
    const transformedRecord = this.transformDbTrainingRecordToShared([
      trainingRecordFromDb,
    ]);
    const parsedResult = trainingRecordSchema.array().parse(transformedRecord);
    return parsedResult[0];
  }

  async create(
    record: Omit<TrainingRecord, "id">,
    userId: string
  ): Promise<TrainingRecord> {
    try {
      const validatedInput = trainingRecordSchema
        .omit({ id: true })
        .parse(record);

      const recordToCreate: Omit<DbTrainingRecordEntity, "sK"> = {
        pK: validatedInput.ownerId,
        entityType: "trainingRecord",
        entityOwner: validatedInput.ownerId[0] == "v" ? "volunteer" : "mp",
        recordName: validatedInput.recordName,
        recordExpiry: validatedInput.recordExpiry,
        details: validatedInput.details,
      };
      const createdRecordId = await this.trainingRecordRepository.create(
        recordToCreate,
        userId
      );
      const fetchedRecord = await this.getById(
        validatedInput.ownerId,
        createdRecordId
      );
      if (!fetchedRecord) {
        throw new Error("Failed to fetch created training record");
      }

      const { id, ...restFetched } = fetchedRecord;

      if (JSON.stringify(validatedInput) !== JSON.stringify(restFetched)) {
        throw new Error("Created record does not match expected values");
      }

      return fetchedRecord;
    } catch (error) {
      console.error("Service Layer Error creating training record:", error);
      throw error;
    }
  }
  async update(
    record: TrainingRecord,
    userId: string
  ): Promise<TrainingRecord> {
    try {
      const validatedInput = trainingRecordSchema.parse(record);

      const dbRecord: DbTrainingRecordEntity = {
        pK: validatedInput.ownerId,
        sK: validatedInput.id,
        entityType: "trainingRecord",
        entityOwner: validatedInput.ownerId[0] == "v" ? "volunteer" : "mp",
        recordName: validatedInput.recordName,
        recordExpiry: validatedInput.recordExpiry,
        details: validatedInput.details,
      };

      await this.trainingRecordRepository.update(dbRecord, userId);

      const fetchedRecord = await this.getById(
        validatedInput.ownerId,
        validatedInput.id
      );
      if (!fetchedRecord) {
        throw new Error("Failed to fetch updated training record");
      }

      // Assert exact equality for update
      if (JSON.stringify(validatedInput) !== JSON.stringify(fetchedRecord)) {
        throw new Error("Updated record does not match expected values");
      }

      return fetchedRecord;
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
