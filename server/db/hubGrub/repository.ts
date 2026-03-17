import { DbHubGrubLog, dbHubGrubLog } from "./schema";
import { dropNullFields, client, getTableName } from "../repository";
import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export class HubGrubLogRepository {
  async getAll(user: User): Promise<DbHubGrubLog[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI3",
      KeyConditionExpression: "entityType = :pk",
      ExpressionAttributeValues: {
        ":pk": "hubGrubLogEntity",
      },
    });
    try {
      const result = await client.send(command);
      const parsedResult = dbHubGrubLog.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Repository Layer Error getting item:", error);
      throw error;
    }
  }

  async getById(hubGrubLogId: string, user: User): Promise<DbHubGrubLog[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI4",
      KeyConditionExpression: "sK = :sk",
      ExpressionAttributeValues: {
        ":sk": hubGrubLogId,
      },
    });

    try {
      const result = await client.send(command);
      const parsedResult = dbHubGrubLog.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Repository Layer Error getting hubGrubLog by ID:", error);
      throw error;
    }
  }

  async getByDateInterval(
    input: {
      startDate: string;
      endDate: string;
    },
    user: User
  ): Promise<DbHubGrubLog[]> {
    const { startDate, endDate } = z
      .object({
        startDate: z.string().date(),
        endDate: z.string().date(),
      })
      .parse(input);
    const command = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI3",
      KeyConditionExpression:
        "entityType = :pk AND #date BETWEEN :startDate AND :endDate",
      ExpressionAttributeNames: {
        "#date": "date",
      },
      ExpressionAttributeValues: {
        ":pk": "hubGrubLogEntity",
        ":startDate": startDate,
        ":endDate": endDate,
      },
    });

    try {
      const result = await client.send(command);
      const parsedResult = dbHubGrubLog.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Repository Layer Error getting hubGrubLogs by date interval:", error);
      throw error;
    }
  }

  async createHubGrubEntity(
    newHubGrubLogs: (Omit<DbHubGrubLog, "pK" | "sK"> | Omit<DbHubGrubLog, "sK">)[],
    user: User
  ): Promise<string> {
    const uuid = uuidv4();
    const key = `hg#${uuid}`;
    const newItems = newHubGrubLogs.map((log) => ({ pK: key, sK: key, ...log }));
    const validatedItems = dbHubGrubLog.array().parse(newItems);
    try {
      await Promise.all(
        validatedItems.map((newItem) =>
          client.send(
            new PutCommand({
              TableName: getTableName(user),
              Item: dropNullFields(newItem),
            })
          )
        )
      );
      return key;
    } catch (error) {
      console.error("Repository Layer Error creating hubGrubLogs:", error);
      throw error;
    }
  }

  async createHubGrubReference(
    hubGrubId: string,
    newHubGrubLogs: Omit<DbHubGrubLog, "sK">[],
    user: User
  ): Promise<string> {
    const newItems = newHubGrubLogs.map((log) => ({ ...log, sK: hubGrubId }));
    const validatedItems = dbHubGrubLog.array().parse(newItems);
    try {
      await Promise.all(
        validatedItems.map((newItem) =>
          client.send(
            new PutCommand({
              TableName: getTableName(user),
              Item: dropNullFields(newItem),
            })
          )
        )
      );
      return hubGrubId;
    } catch (error) {
      console.error("Repository Layer Error creating hubGrubLogs:", error);
      throw error;
    }
  }

  async update(updatedLogs: DbHubGrubLog[], user: User): Promise<void> {
    const validatedLogs = dbHubGrubLog.array().parse(updatedLogs);
    try {
      await Promise.all(
        validatedLogs.map((log) =>
          client.send(
            new PutCommand({
              TableName: getTableName(user),
              Item: dropNullFields(log),
            })
          )
        )
      );
    } catch (error) {
      console.error("Repository Layer Error updating hubGrubLogs:", error);
      throw error;
    }
  }

  async delete(hubGrubLogId: string, user: User): Promise<number[]> {
    const existingLogs = await this.getById(hubGrubLogId, user);
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
      console.error("Repository Layer Error deleting hubGrubLogs:", error);
      throw error;
    }
  }
}
