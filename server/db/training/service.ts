import {
  TrainingRecord,
  trainingRecordSchema,
  EndTrainingRecordDetails,
  endTrainingRecordDetailsSchema,
} from "shared";
import { TrainingRecordRepository } from "./repository";
import { DbTrainingRecord } from "./schema";
import { addDbMiddleware } from "../service";
import { z } from "zod";

export class TrainingRecordService {
  trainingRecordRepository = new TrainingRecordRepository();
  async getAll(user: User): Promise<TrainingRecord[]> {
    try {
      const trainingRecordsFromDb = await this.trainingRecordRepository.getAll(
        user
      );
      const transformedRecords = this.transformDbTrainingRecordToShared(
        trainingRecordsFromDb
      ) as TrainingRecord[];
      const parsedResult = trainingRecordSchema
        .array()
        .parse(transformedRecords);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error getting all training records:", error);
      throw error;
    }
  }

  async getAllNotEnded(user: User): Promise<TrainingRecord[]> {
    try {
      const trainingRecordsFromDb =
        await this.trainingRecordRepository.getAllNotEnded(user);
      const transformedRecords = this.transformDbTrainingRecordToShared(
        trainingRecordsFromDb
      ) as TrainingRecord[];
      const parsedResult = trainingRecordSchema
        .array()
        .parse(transformedRecords);
      return parsedResult;
    } catch (error) {
      console.error(
        "Service Layer Error getting not-ended training records:",
        error
      );
      throw error;
    }
  }

  async getByExpiringBefore(
    user: User,
    expiryDate: string
  ): Promise<TrainingRecord[]> {
    try {
      const trainingRecordFromDb =
        await this.trainingRecordRepository.getByExpiringBefore(
          user,
          expiryDate
        );
      const transformedRecords = this.transformDbTrainingRecordToShared(
        trainingRecordFromDb
      ) as TrainingRecord[];
      const parsedResult = trainingRecordSchema
        .array()
        .parse(transformedRecords);
      return parsedResult;
    } catch (error) {
      console.error(
        "Service Layer Error getting training records expiring before date:",
        error
      );
      throw error;
    }
  }

  async getById(
    user: User,
    ownerId: string,
    recordId: string
  ): Promise<TrainingRecord | null> {
    try {
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
      const parsedResult = trainingRecordSchema
        .array()
        .parse(transformedRecord);
      return parsedResult[0];
    } catch (error) {
      console.error(
        "Service Layer Error getting training record by ID:",
        error
      );
      throw error;
    }
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
      const newRecord: Omit<DbTrainingRecord, "sK"> = addDbMiddleware(
        {
          ...rest,
          pK: ownerId,
          entityType: "trainingRecord",
        },
        user
      );
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

      const updatedRecord: DbTrainingRecord = addDbMiddleware(
        {
          pK: ownerId,
          sK: id,
          entityType: "trainingRecord",
          ...rest,
        },
        user
      );

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

  async end(user: User, input: EndTrainingRecordDetails): Promise<void> {
    try {
      const validated = endTrainingRecordDetailsSchema.parse(input);

      const record = await this.trainingRecordRepository.getById(
        user,
        validated.ownerId,
        validated.recordId
      );
      if (!record) throw new Error("Training record not found");

      const currentEnd = (record.endDate ?? "") as string;
      const isOpen = currentEnd === "open" || currentEnd === "";
      const shouldUpdate =
        isOpen || new Date(validated.endDate) < new Date(currentEnd);
      if (!shouldUpdate) return;

      const updatedRecord: DbTrainingRecord = addDbMiddleware(
        { ...record, endDate: validated.endDate },
        user
      );
      await this.trainingRecordRepository.update(updatedRecord, user);
    } catch (error) {
      console.error("Service Layer Error ending training record:", error);
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
