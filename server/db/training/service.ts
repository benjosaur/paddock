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
  ): Promise<string> {
    try {
      const validatedInput = trainingRecordSchema
        .omit({ id: true })
        .parse(record);
      const { ownerId, ...rest } = validatedInput;
      const newRecord: Omit<DbTrainingRecord, "sK"> = {
        ...rest,
        pK: ownerId,
        entityType: "trainingRecord",
      };
      const createdRecordId = await this.trainingRecordRepository.create(
        newRecord,
        user
      );
      return createdRecordId;
    } catch (error) {
      console.error("Service Layer Error creating training record:", error);
      throw error;
    }
  }
  async update(record: TrainingRecord, user: User): Promise<void> {
    try {
      const validatedInput = trainingRecordSchema.parse(record);
      const { id, ownerId, ...rest } = validatedInput;

      const updatedRecord: DbTrainingRecord = {
        pK: ownerId,
        sK: id,
        entityType: "trainingRecord",
        ...rest,
      };

      await this.trainingRecordRepository.update(updatedRecord, user);
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
    records: DbTrainingRecord[]
  ): TrainingRecord[] {
    return records.map((record) => {
      const { pK, sK, entityType, ...rest } = record;
      return { id: sK, ownerId: pK, ...rest };
    });
  }
}
