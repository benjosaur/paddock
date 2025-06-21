import {
  dbClientMetadata,
  DbClientMetadata,
  DbClientFull,
  dbClientFull,
} from "./schema";
import { client, TABLE_NAME } from "../repository";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

export class ClientRepository {
  async getAll(): Promise<DbClientMetadata[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression:
        "entityOwner = :pk AND begins_with(entityType, :sk)",
      ExpressionAttributeValues: {
        ":pk": "client",
        ":sk": "client",
      },
    });
    try {
      const result = await client.send(command);
      const parsedResult = dbClientMetadata.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting item:", error);
      throw error;
    }
  }

  async getById(clientId: string): Promise<DbClientFull[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pK = :pk",
      ExpressionAttributeValues: {
        ":pk": clientId,
      },
    });

    try {
      const result = await client.send(command);
      const parsedResult = dbClientFull.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting client by ID:", error);
      throw error;
    }
  }
}
