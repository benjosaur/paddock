import {
  client,
  getTableName,
  addCreateMiddleware,
  addUpdateMiddleware,
} from "../repository";
import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DbClientRequestEntity, dbClientRequestEntity } from "./schema";
import { v4 as uuidv4 } from "uuid";

export class RequestRepository {
  async getAll(user: User): Promise<DbClientRequestEntity[]> {
    // Get MP requests
    const mpRequestCommand = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI6",
      KeyConditionExpression: "entityType = :pk",
      ExpressionAttributeValues: {
        ":pk": "clientMpRequest",
      },
    });

    // Get volunteer requests
    const volunteerRequestCommand = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI6",
      KeyConditionExpression: "entityType = :pk",
      ExpressionAttributeValues: {
        ":pk": "clientVolunteerRequest",
      },
    });

    try {
      const [mpResult, volunteerResult] = await Promise.all([
        client.send(mpRequestCommand),
        client.send(volunteerRequestCommand),
      ]);

      const allItems = [
        ...(mpResult.Items || []),
        ...(volunteerResult.Items || []),
      ];
      const parsedResult = dbClientRequestEntity.array().parse(allItems);
      return parsedResult;
    } catch (error) {
      console.error("Error getting client requests:", error);
      throw error;
    }
  }

  async getByClientId(
    user: User,
    clientId: string
  ): Promise<DbClientRequestEntity[]> {
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
      const parsedResult = dbClientRequestEntity.array().parse(result.Items);
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
  ): Promise<DbClientRequestEntity | null> {
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
      return dbClientRequestEntity.parse(result.Items[0]);
    } catch (error) {
      console.error("Error getting client request by id:", error);
      throw error;
    }
  }

  async create(
    newRequest: Omit<DbClientRequestEntity, "sK">,
    user: User
  ): Promise<string> {
    try {
      const uuid = uuidv4();
      const requestKey = `req#${uuid}`;
      const fullRequest: DbClientRequestEntity = {
        sK: requestKey,
        ...newRequest,
      };
      const validatedRequest = dbClientRequestEntity.parse(fullRequest);
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

  async update(
    updatedRequest: DbClientRequestEntity,
    user: User
  ): Promise<void> {
    try {
      const validatedRequest = dbClientRequestEntity.parse(updatedRequest);
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

  async getByStartDateBefore(
    user: User,
    startDate: string
  ): Promise<DbClientRequestEntity[]> {
    const mpRequestCommand = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI4",
      KeyConditionExpression: "entityType = :pk AND #date < :startDate",
      ExpressionAttributeNames: {
        "#date": "date",
      },
      ExpressionAttributeValues: {
        ":pk": "clientMpRequest",
        ":startDate": startDate,
      },
    });

    const volunteerRequestCommand = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI4",
      KeyConditionExpression: "entityType = :pk AND #date < :startDate",
      ExpressionAttributeNames: {
        "#date": "date",
      },
      ExpressionAttributeValues: {
        ":pk": "clientVolunteerRequest",
        ":startDate": startDate,
      },
    });

    try {
      const [mpResult, volunteerResult] = await Promise.all([
        client.send(mpRequestCommand),
        client.send(volunteerRequestCommand),
      ]);

      const allItems = [
        ...(mpResult.Items || []),
        ...(volunteerResult.Items || []),
      ];
      const parsedResult = dbClientRequestEntity.array().parse(allItems);
      return parsedResult;
    } catch (error) {
      console.error("Error getting requests by start date:", error);
      throw error;
    }
  }
}
