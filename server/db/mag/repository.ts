import { DbMagLog, dbMagLog } from "./schema";
import {
  addCreateMiddleware,
  addUpdateMiddleware,
  client,
  TABLE_NAME,
} from "../repository";
import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

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

  async create(
    newMpLogs: (Omit<DbMagLog, "pK" | "sK"> | Omit<DbMagLog, "sK">)[],
    userId: string
  ): Promise<string> {
    const uuid = uuidv4();
    const key = `mag#${uuid}`;
    const newItems = newMpLogs.map((mpLog) =>
      mpLog.entityOwner == "main"
        ? { pK: key, sK: key, ...mpLog }
        : {
            sK: key,
            ...mpLog,
          }
    );
    const validatedItems = dbMagLog.array().parse(newItems);
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
  async update(updatedMpLogs: DbMagLog[], userId: string): Promise<void> {
    const mpLogKey = updatedMpLogs[0].sK;
    await this.delete(mpLogKey);

    const validatedLogs = dbMagLog.array().parse(updatedMpLogs);
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
  async delete(magLogId: string): Promise<number[]> {
    const existingLogs = await this.getById(magLogId);
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
