import {
  client,
  getTableName,
  addCreateMiddleware,
  addUpdateMiddleware,
} from "../repository";
import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DbRequest, dbRequest } from "./schema";
import { v4 as uuidv4 } from "uuid";
import { firstYear } from "shared/const";

export class RequestRepository {
  async getAllActive(user: User): Promise<DbRequest[]> {
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentYear = parseInt(currentDate.slice(0, 4));

    const openRequestCommand = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI3",
      KeyConditionExpression: "entityType = :pk",
      ExpressionAttributeValues: {
        ":pk": `request#open`,
      },
    });

    const endsAfterTodayRequestCommand = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI3",
      KeyConditionExpression: `entityType = :pk AND endDate >= :sK`,
      ExpressionAttributeValues: {
        ":pk": `request#${currentYear}`,
        ":sK": currentDate,
      },
    });

    try {
      const [openRequestResult, endsAfterTodayRequestResult] =
        await Promise.all([
          client.send(openRequestCommand),
          client.send(endsAfterTodayRequestCommand),
        ]);

      const allItems = [
        ...(openRequestResult.Items || []),
        ...(endsAfterTodayRequestResult.Items || []),
      ];
      const parsedResult = dbRequest.array().parse(allItems);
      return parsedResult;
    } catch (error) {
      console.error("Error getting client requests:", error);
      throw error;
    }
  }

  async getAll(user: User): Promise<DbRequest[]> {
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentYear = parseInt(currentDate.slice(0, 4));

    const commands: QueryCommand[] = [];

    for (let year = firstYear; year <= currentYear; year++) {
      const packageEndedInYear = new QueryCommand({
        TableName: getTableName(user),
        IndexName: "GSI3",
        KeyConditionExpression: `entityType = :pk`,
        ExpressionAttributeValues: {
          ":pk": `request#${year}`,
        },
      });
      commands.push(packageEndedInYear);
    }

    try {
      const results = await Promise.all(
        commands.map((command) => client.send(command))
      );

      const allItems = results.flatMap((result) => result.Items);
      const parsedResult = dbRequest.array().parse(allItems);
      return parsedResult;
    } catch (error) {
      console.error("Error getting client requests:", error);
      throw error;
    }
  }

  async getByClientId(user: User, clientId: string): Promise<DbRequest[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
      KeyConditionExpression: "pK = :pk AND begins_with(sK, :sk)",
      ExpressionAttributeValues: {
        ":pk": clientId,
        ":sk": "req#",
      },
    });
    try {
      const result = await client.send(command);
      const parsedResult = dbRequest.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting client requests by client ID:", error);
      throw error;
    }
  }

  async getById(
    user: User,
    clientId: string,
    requestId: string
  ): Promise<DbRequest | null> {
    const command = new QueryCommand({
      TableName: getTableName(user),
      KeyConditionExpression: "pK = :pk AND sK = :sk",
      ExpressionAttributeValues: {
        ":pk": clientId,
        ":sk": requestId,
      },
    });
    try {
      const result = await client.send(command);
      if (!result.Items || result.Items.length === 0) {
        return null;
      }
      return dbRequest.parse(result.Items[0]);
    } catch (error) {
      console.error("Error getting client request by id:", error);
      throw error;
    }
  }

  async create(newRequest: Omit<DbRequest, "sK">, user: User): Promise<string> {
    try {
      const uuid = uuidv4();
      const requestKey = `req#${uuid}`;
      const fullRequest: DbRequest = {
        sK: requestKey,
        ...newRequest,
      };
      const validatedRequest = dbRequest.parse(fullRequest);
      const command = new PutCommand({
        TableName: getTableName(user),
        Item: addCreateMiddleware(validatedRequest, user),
      });

      await client.send(command);
      return requestKey;
    } catch (error) {
      console.error("Repository Layer Error creating client request:", error);
      throw error;
    }
  }

  async update(updatedRequest: DbRequest, user: User): Promise<void> {
    try {
      const validatedRequest = dbRequest.parse(updatedRequest);
      const command = new PutCommand({
        TableName: getTableName(user),
        Item: addUpdateMiddleware(validatedRequest, user),
      });

      await client.send(command);
    } catch (error) {
      console.error("Repository Layer Error updating client request:", error);
      throw error;
    }
  }

  async delete(
    user: User,
    clientId: string,
    requestId: string
  ): Promise<number[]> {
    try {
      const command = new DeleteCommand({
        TableName: getTableName(user),
        Key: {
          pK: clientId,
          sK: requestId,
        },
      });

      await client.send(command);
      return [1];
    } catch (error) {
      console.error("Repository Layer Error deleting client request:", error);
      throw error;
    }
  }
}
