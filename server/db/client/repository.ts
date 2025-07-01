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
  TABLE_NAME,
  addCreateMiddleware,
  addUpdateMiddleware,
} from "../repository";
import { PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

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
      console.error("Repository Layer Error getting item:", error);
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
      console.error("Repository Layer Error getting client by ID:", error);
      throw error;
    }
  }

  async create(
    newClient: Omit<DbClientEntity, "pK" | "sK">
  ): Promise<DbClientFull[]> {
    const uuid = uuidv4();
    const key = `c#${uuid}`;
    const fullClient: DbClientEntity = { pK: key, sK: key, ...newClient };
    const validatedFullClient = dbClientEntity.parse(fullClient);
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: addCreateMiddleware(validatedFullClient),
    });

    try {
      await client.send(command);
      const createdClient = await this.getById(key);
      return dbClientFull.array().parse(createdClient);
    } catch (error) {
      console.error("Repository Layer Error creating client:", error);
      throw error;
    }
  }

  async update(updatedClient: DbClientEntity): Promise<DbClientFull[]> {
    const validatedFullClient = dbClientEntity.parse(updatedClient);
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: addUpdateMiddleware(validatedFullClient),
    });

    try {
      await client.send(command);
      const updatedClientData = await this.getById(updatedClient.pK);
      return updatedClientData;
    } catch (error) {
      console.error("Repository Layer Error updating client:", error);
      throw error;
    }
  }

  async delete(clientId: string): Promise<number[]> {
    try {
      const clientData = await this.getById(clientId);
      let deletedCount = 0;

      for (const item of clientData) {
        const command = new DeleteCommand({
          TableName: TABLE_NAME,
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
