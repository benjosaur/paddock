import { DbMagLog, dbMagLog } from "./schema";
import { dropNullFields, client, getTableName } from "../repository";
import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export class MagLogRepository {
  async getAll(user: User): Promise<DbMagLog[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI3",
      KeyConditionExpression: "entityType = :pk",
      ExpressionAttributeValues: {
        ":pk": "magLogEntity",
      },
    });
    try {
      const result = await client.send(command);
      const parsedResult = dbMagLog.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Repository Layer Error getting item:", error);
      throw error;
    }
  }

  async getById(magLogId: string, user: User): Promise<DbMagLog[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI4",
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
      console.error("Repository Layer Error getting magLog by ID:", error);
      throw error;
    }
  }

  async getByDateInterval(
    input: {
      startDate: string;
      endDate: string;
    },
    user: User
  ): Promise<DbMagLog[]> {
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
      console.error("Repository Layer Error getting magLogs by magId:", error);
      throw error;
    }
  }

  async createMagEntity(
    newMpLogs: (Omit<DbMagLog, "pK" | "sK"> | Omit<DbMagLog, "sK">)[],
    user: User
  ): Promise<string> {
    const uuid = uuidv4();
    const key = `mag#${uuid}`;
    const newItems = newMpLogs.map((mpLog) => ({ pK: key, sK: key, ...mpLog }));
    const validatedItems = dbMagLog.array().parse(newItems);
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
      console.error("Repository Layer Error creating mpLogs:", error);
      throw error;
    }
  }

  async createMagReference(
    magId: string,
    newMpLogs: Omit<DbMagLog, "sK">[],
    user: User
  ): Promise<string> {
    const newItems = newMpLogs.map((mpLog) => ({ ...mpLog, sK: magId }));
    const validatedItems = dbMagLog.array().parse(newItems);
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
      return magId;
    } catch (error) {
      console.error("Repository Layer Error creating mpLogs:", error);
      throw error;
    }
  }

  async update(updatedagLogs: DbMagLog[], user: User): Promise<void> {
    const validatedLogs = dbMagLog.array().parse(updatedagLogs);
    console.log("REPOSITORY LAYER UPDATING MP LOGS", validatedLogs);
    console.log(validatedLogs.map((log) => dropNullFields(log)));
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
      console.error("Repository Layer Error updating mpLogs:", error);
      throw error;
    }
  }
  async delete(magLogId: string, user: User): Promise<number[]> {
    const existingLogs = await this.getById(magLogId, user);
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
