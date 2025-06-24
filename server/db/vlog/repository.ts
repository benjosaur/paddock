// need to make sure write notes to all logs owned by clients and volunteers as well

import { DbVolunteerLog, dbVolunteerLog } from "./schema";
import { client, TABLE_NAME } from "../repository";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { logZodError } from "../../utils/helpers";

export class VolunteerLogRepository {
  async getAll(): Promise<DbVolunteerLog[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
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

  async getById(volunteerLogId: string): Promise<DbVolunteerLog[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
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

  async getMetaLogsBySubstring(string: string): Promise<DbVolunteerLog[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
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
    volunteerId: string
  ): Promise<DbVolunteerLog[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
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
}
