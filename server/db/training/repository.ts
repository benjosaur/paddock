import {
  client,
  TABLE_NAME,
  addCreateMiddleware,
  addUpdateMiddleware,
} from "../repository";
import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { DbTrainingRecordEntity, dbTrainingRecordEntity } from "./schema";
import { v4 as uuidv4 } from "uuid";

export class TrainingRecordRepository {
  async getAll(): Promise<DbTrainingRecordEntity[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI3",
      KeyConditionExpression: "entityType = :pk",
      ExpressionAttributeValues: {
        ":pk": "trainingRecord",
      },
    });
    try {
      const result = await client.send(command);
      const parsedResult = dbTrainingRecordEntity.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting training record:", error);
      throw error;
    }
  }

  async getByExpiringBefore(
    expiryDate: string
  ): Promise<DbTrainingRecordEntity[]> {
    const validatedExpiryDate = z.string().date().parse(expiryDate);
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI3",
      KeyConditionExpression: "entityType = :pk AND recordExpiry < :expiryDate",
      ExpressionAttributeValues: {
        ":pk": "trainingRecord",
        ":expiryDate": validatedExpiryDate,
      },
    });
    try {
      const result = await client.send(command);
      const parsedResult = dbTrainingRecordEntity.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting training records by expiry date:", error);
      throw error;
    }
  }

  async getById(
    ownerId: string,
    recordId: string
  ): Promise<DbTrainingRecordEntity | null> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pK = :pk AND sK = :sk",
      ExpressionAttributeValues: {
        ":pk": ownerId,
        ":sk": recordId,
      },
    });
    try {
      const result = await client.send(command);
      if (!result.Items || result.Items.length === 0) {
        return null;
      }
      return dbTrainingRecordEntity.parse(result.Items[0]);
    } catch (error) {
      console.error("Error getting training record by id:", error);
      throw error;
    }
  }

  async create(
    newRecord: Omit<DbTrainingRecordEntity, "sK">,
    userId: string
  ): Promise<string> {
    try {
      const uuid = uuidv4();
      const recordKey = `tr#${uuid}`;
      const fullRecord: DbTrainingRecordEntity = {
        sK: recordKey,
        ...newRecord,
      };
      const validatedRecord = dbTrainingRecordEntity.parse(fullRecord);
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: addCreateMiddleware(validatedRecord, userId),
      });

      await client.send(command);
      return recordKey;
    } catch (error) {
      console.error("Repository Layer Error creating training record:", error);
      throw error;
    }
  }

  async update(
    updatedRecord: DbTrainingRecordEntity,
    userId: string
  ): Promise<void> {
    try {
      const validatedRecord = dbTrainingRecordEntity.parse(updatedRecord);
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: addUpdateMiddleware(validatedRecord, userId),
      });

      await client.send(command);
    } catch (error) {
      console.error("Repository Layer Error updating training record:", error);
      throw error;
    }
  }

  async delete(ownerId: string, recordId: string): Promise<number[]> {
    try {
      const command = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          pK: ownerId,
          sK: recordId,
        },
      });

      await client.send(command);
      return [1];
    } catch (error) {
      console.error("Repository Layer Error deleting training record:", error);
      throw error;
    }
  }
}
