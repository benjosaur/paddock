import {
  client,
  getTableName,
  addCreateMiddleware,
  addUpdateMiddleware,
} from "../repository";
import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { DbTrainingRecordEntity, dbTrainingRecordEntity } from "./schema";
import { v4 as uuidv4 } from "uuid";

export class TrainingRecordRepository {
  async getAll(user: User): Promise<DbTrainingRecordEntity[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
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
    user: User,
    expiryDate: string
  ): Promise<DbTrainingRecordEntity[]> {
    const validatedExpiryDate = z.string().date().parse(expiryDate);
    const command = new QueryCommand({
      TableName: getTableName(user),
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
    user: User,
    ownerId: string,
    recordId: string
  ): Promise<DbTrainingRecordEntity | null> {
    const command = new QueryCommand({
      TableName: getTableName(user),
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
    user: User
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
        TableName: getTableName(user),
        Item: addCreateMiddleware(validatedRecord, user),
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
    user: User
  ): Promise<void> {
    try {
      const validatedRecord = dbTrainingRecordEntity.parse(updatedRecord);
      const command = new PutCommand({
        TableName: getTableName(user),
        Item: addUpdateMiddleware(validatedRecord, user),
      });

      await client.send(command);
    } catch (error) {
      console.error("Repository Layer Error updating training record:", error);
      throw error;
    }
  }

  async delete(
    user: User,
    ownerId: string,
    recordId: string
  ): Promise<number[]> {
    try {
      const command = new DeleteCommand({
        TableName: getTableName(user),
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
