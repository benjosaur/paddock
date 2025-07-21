import {
  client,
  getTableName,
  addCreateMiddleware,
  addUpdateMiddleware,
} from "../repository";
import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import {
  DbRequest,
  dbRequest,
  DbRequestEntity,
  dbRequestEntity,
} from "./schema";
import { v4 as uuidv4 } from "uuid";
import { firstYear } from "shared/const";

export class RequestRepository {
  async getAllActive(user: User): Promise<DbRequestEntity[]> {
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentYear = parseInt(currentDate.slice(0, 4));

    const commands: QueryCommand[] = [];

    for (let year = firstYear; year <= currentYear; year++) {
      const packageEndedInYear = new QueryCommand({
        TableName: getTableName(user),
        IndexName: "GSI1",
        KeyConditionExpression: `entityType = :pk AND archived = :sk`,
        ExpressionAttributeValues: {
          ":pk": `request#${year}`,
          ":sk": "N",
        },
      });
      commands.push(packageEndedInYear);
    }

    const openRequestCommand = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI1",
      KeyConditionExpression: "entityType = :pk AND archived = :sk",
      ExpressionAttributeValues: {
        ":pk": `request#open`,
        ":sk": "N",
      },
    });

    commands.push(openRequestCommand);

    try {
      const results = await Promise.all(
        commands.map((command) => client.send(command))
      );

      const allItems = results.flatMap((result) => result.Items);
      const parsedResult = dbRequestEntity.array().parse(allItems);
      return parsedResult;
    } catch (error) {
      console.error("Error getting client requests:", error);
      throw error;
    }
  }

  async getAllOpen(user: User): Promise<DbRequestEntity[]> {
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
      const parsedResult = dbRequestEntity.array().parse(allItems);
      return parsedResult;
    } catch (error) {
      console.error("Error getting client requests:", error);
      throw error;
    }
  }

  async getAll(user: User): Promise<DbRequestEntity[]> {
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

    const openRequestCommand = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI3",
      KeyConditionExpression: "entityType = :pk",
      ExpressionAttributeValues: {
        ":pk": `request#open`,
      },
    });

    commands.push(openRequestCommand);

    try {
      const results = await Promise.all(
        commands.map((command) => client.send(command))
      );

      const allItems = results.flatMap((result) => result.Items);
      const parsedResult = dbRequestEntity.array().parse(allItems);
      return parsedResult;
    } catch (error) {
      console.error("Error getting client requests:", error);
      throw error;
    }
  }

  async getById(requestId: string, user: User): Promise<DbRequest[]> {
    // also returns associated packages
    const command = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI2",
      KeyConditionExpression: "requestId = :requestId",
      ExpressionAttributeValues: {
        ":requestId": requestId,
      },
    });
    try {
      const result = await client.send(command);
      if (!result.Items || result.Items.length === 0) {
        throw new Error(`Request with ID ${requestId} not found`);
      }
      console.log(result.Items);
      return dbRequest.array().parse(result.Items);
    } catch (error) {
      console.error("Repository Layer Error getting request by id:", error);
      throw error;
    }
  }

  async create(
    newRequest: Omit<DbRequestEntity, "sK" | "requestId">,
    user: User
  ): Promise<string> {
    try {
      const uuid = uuidv4();
      const requestKey = `req#${uuid}`;
      const fullRequest: DbRequestEntity = {
        sK: requestKey,
        requestId: requestKey,
        ...newRequest,
      };
      const validatedRequest = dbRequestEntity.parse(fullRequest);
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

  async update(updatedRequest: DbRequestEntity, user: User): Promise<void> {
    try {
      const validatedRequest = dbRequestEntity.parse(updatedRequest);
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
