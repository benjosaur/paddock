import { DbMagLog, dbMagLog } from "./schema";
import { client, TABLE_NAME } from "../repository";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";

export class MagLogRepository {
  async getAll(): Promise<DbMagLog[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI4",
      KeyConditionExpression: "entityType = :pk",
      ExpressionAttributeValues: {
        ":pk": "magLog",
      },
    });
    try {
      const result = await client.send(command);
      const parsedResult = dbMagLog.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting item:", error);
      throw error;
    }
  }

  async getById(magLogId: string): Promise<DbMagLog[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI2",
      KeyConditionExpression: "sK = :sk",
      ExpressionAttributeValues: {
        ":sk": magLogId,
      },
    });

    try {
      const result = await client.send(command);
      const parsedResult = dbMagLog.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting magLog by ID:", error);
      throw error;
    }
  }

  async getByDateInterval(input: {
    startDate: string;
    endDate: string;
  }): Promise<DbMagLog[]> {
    const { startDate, endDate } = z
      .object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      })
      .parse(input);
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI4",
      KeyConditionExpression:
        "entityType = :pk AND #date BETWEEN :startDate AND :endDate",
      ExpressionAttributeNames: {
        "#date": "date",
      },
      ExpressionAttributeValues: {
        ":pk": "magLog",
        ":startDate": startDate,
        ":endDate": endDate,
      },
    });

    try {
      const result = await client.send(command);
      const parsedResult = dbMagLog.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting magLogs by magId:", error);
      throw error;
    }
  }
}
