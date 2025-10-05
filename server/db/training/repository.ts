import { client, getTableName, dropNullFields } from "../repository";
import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { DbTrainingRecord, dbTrainingRecord } from "./schema";
import { v4 as uuidv4 } from "uuid";

export class TrainingRecordRepository {
  // archived methods removed

  async getAll(user: User): Promise<DbTrainingRecord[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI2",
      KeyConditionExpression: "entityType = :pk",
      ExpressionAttributeValues: {
        ":pk": "trainingRecord",
      },
    });
    try {
      const result = await client.send(command);
      const parsedResult = dbTrainingRecord.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Repository Layer Error getting training records:", error);
      throw error;
    }
  }

  async getAllNotEnded(user: User): Promise<DbTrainingRecord[]> {
    // Here we make a distinction between ended and expired, else views cluttered with expired records of ended carers.
    const openTrainingRecordCommand = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI2",
      KeyConditionExpression: "entityType = :pk AND endDate = :sK",
      ExpressionAttributeValues: {
        ":pk": `trainingRecord`,
        ":sK": "open",
      },
    });
    try {
      const dbTrainingRecords = await client.send(openTrainingRecordCommand);
      const parsedResult = dbTrainingRecord
        .array()
        .parse(dbTrainingRecords.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting training records not ended:", error);
      throw error;
    }
  }

  async getByExpiringBefore(
    user: User,
    expiryDate: string
  ): Promise<DbTrainingRecord[]> {
    const validatedExpiryDate = z.string().date().parse(expiryDate);
    const command = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI5",
      KeyConditionExpression: "entityType = :pk AND expiryDate < :expiryDate",
      ExpressionAttributeValues: {
        ":pk": "trainingRecord",
        ":expiryDate": validatedExpiryDate,
      },
    });
    try {
      const result = await client.send(command);
      const parsedResult = dbTrainingRecord.array().parse(result.Items);
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
  ): Promise<DbTrainingRecord | null> {
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
      return dbTrainingRecord.parse(result.Items[0]);
    } catch (error) {
      console.error("Error getting training record by id:", error);
      throw error;
    }
  }

  async create(
    newRecord: Omit<DbTrainingRecord, "sK">,
    user: User
  ): Promise<string> {
    try {
      const uuid = uuidv4();
      const recordKey = `tr#${uuid}`;
      const fullRecord: DbTrainingRecord = {
        sK: recordKey,
        ...newRecord,
      };
      const validatedRecord = dbTrainingRecord.parse(fullRecord);
      const command = new PutCommand({
        TableName: getTableName(user),
        Item: dropNullFields(validatedRecord),
      });

      await client.send(command);
      return recordKey;
    } catch (error) {
      console.error("Repository Layer Error creating training record:", error);
      throw error;
    }
  }

  async update(updatedRecord: DbTrainingRecord, user: User): Promise<void> {
    try {
      const validatedRecord = dbTrainingRecord.parse(updatedRecord);
      const command = new PutCommand({
        TableName: getTableName(user),
        Item: dropNullFields(validatedRecord),
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
