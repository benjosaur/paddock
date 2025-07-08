import { DbMpLog, dbMpLog } from "./schema";
import {
  client,
  getTableName,
  addCreateMiddleware,
  addUpdateMiddleware,
} from "../repository";
import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export class MpLogRepository {
  async getAll(user: User): Promise<DbMpLog[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
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

  async getById(user: User, mpLogId: string): Promise<DbMpLog[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
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

  async getMetaLogsByPostCode(
    user: User,
    postCode: string
  ): Promise<DbMpLog[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI5",
      KeyConditionExpression: "entityType = :pk AND begins_with(postCode, :sk)",
      ExpressionAttributeValues: {
        ":pk": "mpLog",
        ":sk": postCode,
      },
    });

    try {
      const result = await client.send(command);
      const parsedResult = dbMpLog.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting mpLogs by postcode:", error);
      throw error;
    }
  }

  async getMetaLogsBySubstring(user: User, string: string): Promise<DbMpLog[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
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

  async getMetaLogsByMpId(user: User, mpId: string): Promise<DbMpLog[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
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

  async getByDateInterval(
    user: User,
    input: {
      startDate: string;
      endDate: string;
    }
  ): Promise<DbMpLog[]> {
    const { startDate, endDate } = z
      .object({
        startDate: z.string().date(),
        endDate: z.string().date(),
      })
      .parse(input);
    const command = new QueryCommand({
      TableName: getTableName(user),
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
    user: User
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
              TableName: getTableName(user),
              Item: addCreateMiddleware(newItem, user),
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
  async update(updatedMpLogs: DbMpLog[], user: User): Promise<void> {
    const mpLogKey = updatedMpLogs[0].sK;
    await this.delete(user, mpLogKey);

    const validatedLogs = dbMpLog.array().parse(updatedMpLogs);
    try {
      await Promise.all(
        validatedLogs.map((log) =>
          client.send(
            new PutCommand({
              TableName: getTableName(user),
              Item: addUpdateMiddleware(log, user),
            })
          )
        )
      );
    } catch (error) {
      console.error("Repository Layer Error updating mpLogs:", error);
      throw error;
    }
  }
  async delete(user: User, mpLogId: string): Promise<number[]> {
    const existingLogs = await this.getById(user, mpLogId);
    try {
      await Promise.all(
        existingLogs.map((log) =>
          client.send(
            new DeleteCommand({
              TableName: getTableName(user),
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
