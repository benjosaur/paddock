import {
  DbClientFull,
  dbClientFull,
  DbClientEntity,
  dbClientEntity,
} from "./schema";
import { client, getTableName, dropNullFields } from "../repository";
import { PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

export class ClientRepository {
  // archived methods removed

  async getAll(user: User): Promise<DbClientEntity[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI2",
      KeyConditionExpression: "entityType = :pk",
      ExpressionAttributeValues: {
        ":pk": "client",
      },
    });
    try {
      const result = await client.send(command);
      const parsedResult = dbClientEntity.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Repository Layer Error getting item:", error);
      throw error;
    }
  }

  async getAllNotEndedYet(user: User): Promise<DbClientEntity[]> {
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentYear = parseInt(currentDate.slice(0, 4));

    const openClientCommand = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI2",
      KeyConditionExpression: "entityType = :pk AND endDate = :sK",
      ExpressionAttributeValues: {
        ":pk": `client`,
        ":sK": "open",
      },
    });

    const endsAfterTodayClientCommand = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI2",
      KeyConditionExpression: `entityType = :pk AND endDate > :sK`,
      ExpressionAttributeValues: {
        ":pk": `client#${currentYear}`,
        ":sK": currentDate,
      },
    });

    try {
      const [openClientResult, endsAfterTodayClientResult] = await Promise.all([
        client.send(openClientCommand),
        client.send(endsAfterTodayClientCommand),
      ]);

      const allItems = [
        ...(openClientResult.Items || []),
        ...(endsAfterTodayClientResult.Items || []),
      ];
      const parsedResult = dbClientEntity.array().parse(allItems);
      return parsedResult;
    } catch (error) {
      console.error("Error getting clients not ended yet:", error);
      throw error;
    }
  }

  async getAllWithMagService(user: User): Promise<DbClientEntity[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI2",
      KeyConditionExpression: "entityType = :pk",
      FilterExpression: "contains(details.services, :magService)",
      ExpressionAttributeValues: {
        ":pk": "client",
        ":magService": "MAG",
      },
    });
    try {
      const result = await client.send(command);
      const parsedResult = dbClientEntity.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Repository Layer Error getting MAG clients:", error);
      throw error;
    }
  }

  async getById(clientId: string, user: User): Promise<DbClientFull[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
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
    newClient: Omit<DbClientEntity, "pK" | "sK">,
    user: User
  ): Promise<string> {
    const uuid = uuidv4();
    const key = `c#${uuid}`;
    const fullClient: DbClientEntity = { pK: key, sK: key, ...newClient };
    const validatedFullClient = dbClientEntity.parse(fullClient);
    const command = new PutCommand({
      TableName: getTableName(user),
      Item: dropNullFields(validatedFullClient),
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
      Item: dropNullFields(validatedFullClient),
    });

    try {
      await client.send(command);
    } catch (error) {
      console.error("Repository Layer Error updating client:", error);
      throw error;
    }
  }

  async delete(clientId: string, user: User): Promise<number[]> {
    try {
      const clientData = await this.getById(clientId, user);
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
