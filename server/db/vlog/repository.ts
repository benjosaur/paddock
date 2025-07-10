import { DbVolunteerLog, dbVolunteerLog } from "./schema";
import {
  client,
  getTableName,
  addCreateMiddleware,
  addUpdateMiddleware,
} from "../repository";
import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export class VolunteerLogRepository {
  async getAll(user: User): Promise<DbVolunteerLog[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI6",
      KeyConditionExpression: "entityType = :pk",
      ExpressionAttributeValues: {
        ":pk": "volunteerLog",
      },
    });
    try {
      const result = await client.send(command);
      const parsedResult = dbVolunteerLog.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting item:", error);
      throw error;
    }
  }

  async getById(user: User, volunteerLogId: string): Promise<DbVolunteerLog[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI2",
      KeyConditionExpression: "sK = :sk",
      ExpressionAttributeValues: {
        ":sk": volunteerLogId,
      },
    });

    try {
      const result = await client.send(command);
      const parsedResult = dbVolunteerLog.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting volunteerLog by ID:", error);
      throw error;
    }
  }

  async getMetaLogsBySubstring(
    user: User,
    string: string
  ): Promise<DbVolunteerLog[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI1",
      KeyConditionExpression: "entityOwner = :pk AND entityType = :sk",
      FilterExpression:
        "contains(details.notes, :string) OR contains(details.services, :string)",
      ExpressionAttributeValues: {
        ":pk": "main",
        ":sk": "volunteerLog",
        ":string": string,
      },
    });

    try {
      const result = await client.send(command);
      const parsedResult = dbVolunteerLog.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting volunteerLogs by substring:", error);
      throw error;
    }
  }

  async getMetaLogsByVolunteerId(
    user: User,
    volunteerId: string
  ): Promise<DbVolunteerLog[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
      KeyConditionExpression: "pK = :pk AND begins_with(sK, :sk)",
      ExpressionAttributeValues: {
        ":pk": volunteerId,
        ":sk": "vlog#",
      },
    });

    try {
      const result = await client.send(command);
      const parsedResult = dbVolunteerLog.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting volunteerLogs by volunteerId:", error);
      throw error;
    }
  }

  async getByDateInterval(
    user: User,
    input: {
      startDate: string;
      endDate: string;
    }
  ): Promise<DbVolunteerLog[]> {
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
        ":pk": "volunteerLog",
        ":startDate": startDate,
        ":endDate": endDate,
      },
    });
    try {
      const result = await client.send(command);
      const parsedResult = dbVolunteerLog.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error(
        "Error getting volunteerLogs from db by date range:",
        error
      );
      throw error;
    }
  }

  async create(
    newVolunteerLogs: (
      | Omit<DbVolunteerLog, "pK" | "sK">
      | Omit<DbVolunteerLog, "sK">
    )[],
    user: User
  ): Promise<string> {
    const uuid = uuidv4();
    const key = `vlog#${uuid}`;
    const newItems = newVolunteerLogs.map((volunteerLog) =>
      volunteerLog.entityOwner == "main"
        ? { pK: key, sK: key, ...volunteerLog }
        : {
            sK: key,
            ...volunteerLog,
          }
    );
    const validatedItems = dbVolunteerLog.array().parse(newItems);
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
      console.error("Repository Layer Error creating volunteerLogs:", error);
      throw error;
    }
  }

  async update(
    updatedVolunteerLogs: DbVolunteerLog[],
    user: User
  ): Promise<void> {
    const validatedLogs = dbVolunteerLog.array().parse(updatedVolunteerLogs);
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
      console.error("Repository Layer Error updating volunteerLogs:", error);
      throw error;
    }
  }

  async delete(user: User, volunteerLogId: string): Promise<number[]> {
    const existingLogs = await this.getById(user, volunteerLogId);
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
      console.error("Repository Layer Error deleting volunteerLogs:", error);
      throw error;
    }
  }
}
