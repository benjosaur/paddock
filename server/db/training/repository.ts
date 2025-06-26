import { client, TABLE_NAME } from "../repository";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { DbTrainingRecord, dbTrainingRecordSchema } from "./schema";

export class TrainingRecordRepository {
  async getAll(): Promise<DbTrainingRecord[]> {
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
      const parsedResult = dbTrainingRecordSchema.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting training record:", error);
      throw error;
    }
  }

  async getByExpiringBefore(expiryDate: string): Promise<DbTrainingRecord[]> {
    const validatedExpiryDate = z.string().datetime().parse(expiryDate);
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
      const parsedResult = dbTrainingRecordSchema.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting training records by expiry date:", error);
      throw error;
    }
  }
}
