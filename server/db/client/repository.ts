import {
  dbClientMetadata,
  DbClientMetadata,
  DbClientFull,
  dbClientFull,
  DbClientEntity,
  dbClientEntity,
} from "./schema";
import {
  client,
  getTableName,
  addCreateMiddleware,
  addUpdateMiddleware,
} from "../repository";
import { PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

export class ClientRepository {
  async getAll(user: User): Promise<DbClientMetadata[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
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
      console.error("Repository Layer Error getting item:", error);
      throw error;
    }
  }

  async getById(user: User, clientId: string): Promise<DbClientFull[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
      KeyConditionExpression: "pK = :pk",
      ExpressionAttributeValues: {
        ":pk": clientId,
      },
      ConsistentRead: true,
    });

    try {
      const result = await client.send(command);
      const parsedResult = dbClientFull.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Repository Layer Error getting client by ID:", error);
      throw error;
    }
  }

  async create(
    newClient: Omit<DbClientEntity, "pK" | "sK">,
    user: User
  ): Promise<string> {
    const uuid = uuidv4();
    const key = `c#${uuid}`;
    const fullClient: DbClientEntity = { pK: key, sK: key, ...newClient };
    const validatedFullClient = dbClientEntity.parse(fullClient);
    const command = new PutCommand({
      TableName: getTableName(user),
      Item: addCreateMiddleware(validatedFullClient, user),
    });

    try {
      await client.send(command);
      return key;
    } catch (error) {
      console.error("Repository Layer Error creating client:", error);
      throw error;
    }
  }

  async update(updatedClient: DbClientEntity, user: User): Promise<void> {
    const validatedFullClient = dbClientEntity.parse(updatedClient);
    const command = new PutCommand({
      TableName: getTableName(user),
      Item: addUpdateMiddleware(validatedFullClient, user),
    });

    try {
      await client.send(command);
    } catch (error) {
      console.error("Repository Layer Error updating client:", error);
      throw error;
    }
  }

  async delete(user: User, clientId: string): Promise<number[]> {
    try {
      const clientData = await this.getById(user, clientId);
      let deletedCount = 0;

      for (const item of clientData) {
        const command = new DeleteCommand({
          TableName: getTableName(user),
          Key: {
            pK: item.pK,
            sK: item.sK,
          },
        });
        await client.send(command);
        deletedCount++;
      }

      return [deletedCount];
    } catch (error) {
      console.error("Repository Layer Error deleting client:", error);
      throw error;
    }
  }
}
