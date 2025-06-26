import { DbMpLog, dbMpLog } from "./schema";
import { client, TABLE_NAME } from "../repository";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";

export class MpLogRepository {
  async getAll(): Promise<DbMpLog[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI6",
      KeyConditionExpression: "entityType = :pk",
      ExpressionAttributeValues: {
        ":pk": "mpLog",
      },
    });
    try {
      const result = await client.send(command);
      const parsedResult = dbMpLog.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting item:", error);
      throw error;
    }
  }

  async getById(mpLogId: string): Promise<DbMpLog[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI2",
      KeyConditionExpression: "sK = :sk",
      ExpressionAttributeValues: {
        ":sk": mpLogId,
      },
    });

    try {
      const result = await client.send(command);
      const parsedResult = dbMpLog.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting mpLog by ID:", error);
      throw error;
    }
  }

  async getMetaLogsBySubstring(string: string): Promise<DbMpLog[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "entityOwner = :pk AND entityType = :sk",
      FilterExpression:
        "contains(details.notes, :string) OR contains(details.services, :string)",
      ExpressionAttributeValues: {
        ":pk": "main",
        ":sk": "mpLog",
        ":string": string,
      },
    });

    try {
      const result = await client.send(command);
      const parsedResult = dbMpLog.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting mpLogs by substring:", error);
      throw error;
    }
  }

  async getMetaLogsByMpId(mpId: string): Promise<DbMpLog[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pK = :pk AND begins_with(sK, :sk)",
      ExpressionAttributeValues: {
        ":pk": mpId,
        ":sk": "mplog#",
      },
    });

    try {
      const result = await client.send(command);
      const parsedResult = dbMpLog.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting mpLogs by mpId:", error);
      throw error;
    }
  }

  async getByDateInterval(input: {
    startDate: string;
    endDate: string;
  }): Promise<DbMpLog[]> {
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
        ":pk": "mpLog",
        ":startDate": startDate,
        ":endDate": endDate,
      },
    });
    try {
      const result = await client.send(command);
      const parsedResult = dbMpLog.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting mpLogs from db by date range:", error);
      throw error;
    }
  }
}
