import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { addUpdateMiddleware, client, getTableName } from "../repository";

export class ArchiveRepository {
  async toggleArchived(input: any, user: User): Promise<void> {
    const command = new PutCommand({
      TableName: getTableName(user),
      Item: addUpdateMiddleware(input, user),
    });

    try {
      await client.send(command);
    } catch (error) {
      console.error("Repository Layer Error updating client:", error);
      throw error;
    }
  }
}
