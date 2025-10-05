import { client, getTableName, dropNullFields } from "../repository";
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
  // archived methods removed

  async getAllNotEndedYet(user: User): Promise<DbRequestEntity[]> {
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentYear = parseInt(currentDate.slice(0, 4));

    const openRequestCommand = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI2",
      KeyConditionExpression: "entityType = :pk",
      ExpressionAttributeValues: {
        ":pk": `request#open`,
      },
    });

    const endsAfterTodayRequestCommand = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI2",
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

  async getAll(
    user: User,
    startYear: number = firstYear
  ): Promise<DbRequestEntity[]> {
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentYear = parseInt(currentDate.slice(0, 4));
    const commands: QueryCommand[] = [];

    for (let year = startYear; year <= currentYear; year++) {
      const packageEndedInYear = new QueryCommand({
        TableName: getTableName(user),
        IndexName: "GSI2",
        KeyConditionExpression: `entityType = :pk`,
        ExpressionAttributeValues: {
          ":pk": `request#${year}`,
        },
      });
      commands.push(packageEndedInYear);
    }

    const openRequestCommand = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI2",
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
      IndexName: "GSI1",
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
        Item: dropNullFields(validatedRequest),
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
        Item: dropNullFields(validatedRequest),
      });

      await client.send(command);
    } catch (error) {
      console.error("Repository Layer Error updating client request:", error);
      throw error;
    }
  }

  async delete(requestId: string, user: User): Promise<number[]> {
    const existingLogs = await this.getById(requestId, user);
    try {
      await Promise.all(
        existingLogs.map((log) =>
          client.send(
            new DeleteCommand({
              TableName: getTableName(user),
              Key: { pK: log.pK, sK: log.sK },
            })
          )
        )
      );
      return [existingLogs.length];
    } catch (error) {
      console.error("Repository Layer Error deleting requests:", error);
      throw error;
    }
  }
}
