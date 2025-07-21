import { TrainingRecord, trainingRecordSchema } from "shared";
import { TrainingRecordRepository } from "./repository";
import { DbTrainingRecord } from "./schema";

export class TrainingRecordService {
  trainingRecordRepository = new TrainingRecordRepository();
  async getAll(user: User): Promise<TrainingRecord[]> {
    const trainingRecordsFromDb = await this.trainingRecordRepository.getAll(
      user
    );
    const transformedRecords = this.transformDbTrainingRecordToShared(
      trainingRecordsFromDb
    ) as TrainingRecord[];
    const parsedResult = trainingRecordSchema.array().parse(transformedRecords);
    return parsedResult;
  }

  async getByExpiringBefore(
    user: User,
    expiryDate: string
  ): Promise<TrainingRecord[]> {
    const trainingRecordFromDb =
      await this.trainingRecordRepository.getByExpiringBefore(user, expiryDate);
    const transformedRecords = this.transformDbTrainingRecordToShared(
      trainingRecordFromDb
    ) as TrainingRecord[];
    const parsedResult = trainingRecordSchema.array().parse(transformedRecords);
    return parsedResult;
  }

  async getById(
    user: User,
    ownerId: string,
    recordId: string
  ): Promise<TrainingRecord | null> {
    const trainingRecordFromDb = await this.trainingRecordRepository.getById(
      user,
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
    user: User
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
        user
      );
      const fetchedRecord = await this.getById(
        user,
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
  async update(record: TrainingRecord, user: User): Promise<TrainingRecord> {
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

      await this.trainingRecordRepository.update(dbRecord, user);

      const fetchedRecord = await this.getById(
        user,
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

  async delete(
    user: User,
    ownerId: string,
    recordId: string
  ): Promise<number[]> {
    try {
      const deletedCount = await this.trainingRecordRepository.delete(
        user,
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
    records: DbTrainingRecordEntity[]
  ): TrainingRecord[] {
    return records.map((record) => {
      const { pK, sK, entityType, ...rest } = record;
      return { id: sK, ownerId: pK, ...rest };
    });
  }
}
