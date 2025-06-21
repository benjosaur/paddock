import { dbMpMetadata, DbMpMetadata, DbMpFull, dbMpFull } from "./schema";
import { client, TABLE_NAME } from "../repository";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

export class MpRepository {
  async getAll(): Promise<DbMpMetadata[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "entityOwner = :pk AND entityType = :sk",
      ExpressionAttributeValues: {
        ":pk": "mp",
        ":sk": "mp",
      },
    });
    try {
      const result = await client.send(command);
      const parsedResult = dbMpMetadata.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting item:", error);
      throw error;
    }
  }

  async getById(mpId: string): Promise<DbMpFull[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pK = :pk",
      ExpressionAttributeValues: {
        ":pk": mpId,
      },
    });

    try {
      const result = await client.send(command);
      const parsedResult = dbMpFull.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting mp by ID:", error);
      throw error;
    }
  }
}
