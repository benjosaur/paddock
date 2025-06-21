import {
  dbVolunteerMetadata,
  DbVolunteerMetadata,
  DbVolunteerFull,
  dbVolunteerFull,
} from "./schema";
import { client, TABLE_NAME } from "../repository";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

export class VolunteerRepository {
  async getAll(): Promise<DbVolunteerMetadata[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "entityOwner = :pk AND entityType = :sk",
      ExpressionAttributeValues: {
        ":pk": "volunteer",
        ":sk": "volunteer",
      },
    });
    try {
      const result = await client.send(command);
      const parsedResult = dbVolunteerMetadata.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting item:", error);
      throw error;
    }
  }

  async getById(volunteerId: string): Promise<DbVolunteerFull[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pK = :pk",
      ExpressionAttributeValues: {
        ":pk": volunteerId,
      },
    });

    try {
      const result = await client.send(command);
      const parsedResult = dbVolunteerFull.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting volunteer by ID:", error);
      throw error;
    }
  }
}
