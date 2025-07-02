import { DbMpLog, dbMpLog } from "./schema";
import {
  client,
  TABLE_NAME,
  addCreateMiddleware,
  addUpdateMiddleware,
} from "../repository";
import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

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

  async create(
    newMpLogs: (Omit<DbMpLog, "pK" | "sK"> | Omit<DbMpLog, "sK">)[],
    userId: string
  ): Promise<string> {
    const uuid = uuidv4();
    const key = `mplog#${uuid}`;
    const newItems = newMpLogs.map((mpLog) =>
      mpLog.entityOwner == "main"
        ? { pK: key, sK: key, ...mpLog }
        : {
            sK: key,
            ...mpLog,
          }
    );
    const validatedItems = dbMpLog.array().parse(newItems);
    try {
      await Promise.all(
        validatedItems.map((newItem) =>
          client.send(
            new PutCommand({
              TableName: TABLE_NAME,
              Item: addCreateMiddleware(newItem, userId),
            })
          )
        )
      );
      return key;
    } catch (error) {
      console.error("Repository Layer Error creating mpLogs:", error);
      throw error;
    }
  }
  async update(updatedMpLogs: DbMpLog[], userId: string): Promise<void> {
    const mpLogKey = updatedMpLogs[0].sK;
    await this.delete(mpLogKey);

    const validatedLogs = dbMpLog.array().parse(updatedMpLogs);
    try {
      await Promise.all(
        validatedLogs.map((log) =>
          client.send(
            new PutCommand({
              TableName: TABLE_NAME,
              Item: addUpdateMiddleware(log, userId),
            })
          )
        )
      );
    } catch (error) {
      console.error("Repository Layer Error updating mpLogs:", error);
      throw error;
    }
  }
  async delete(mpLogId: string): Promise<number[]> {
    const existingLogs = await this.getById(mpLogId);
    try {
      await Promise.all(
        existingLogs.map((log) =>
          client.send(
            new DeleteCommand({
              TableName: TABLE_NAME,
              Key: { pK: log.pK, sK: log.sK },
            })
          )
        )
      );
      return [existingLogs.length];
    } catch (error) {
      console.error("Repository Layer Error deleting mpLogs:", error);
      throw error;
    }
  }
}
