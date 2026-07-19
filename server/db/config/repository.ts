import { client, getTableName, dropNullFields } from "../repository";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DbConfigItem, dbConfigItem } from "./schema";

export class ConfigRepository {
  async getAll(user: User): Promise<DbConfigItem[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
      KeyConditionExpression: "pK = :pk",
      ExpressionAttributeValues: {
        ":pk": "config",
      },
    });
    try {
      const result = await client.send(command);
      const parsedResult = dbConfigItem.array().parse(result.Items ?? []);
      return parsedResult;
    } catch (error) {
      console.error("Repository Layer Error getting config:", error);
      throw error;
    }
  }

  async put(user: User, item: DbConfigItem): Promise<void> {
    const command = new PutCommand({
      TableName: getTableName(user),
      Item: dropNullFields(dbConfigItem.parse(item)),
    });
    try {
      await client.send(command);
    } catch (error) {
      console.error("Repository Layer Error putting config:", error);
      throw error;
    }
  }
}
