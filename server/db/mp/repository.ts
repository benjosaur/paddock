import {
  dbMpMetadata,
  DbMpMetadata,
  DbMpFull,
  dbMpFull,
  DbMpEntity,
  dbMpEntity,
} from "./schema";
import {
  client,
  getTableName,
  addCreateMiddleware,
  addUpdateMiddleware,
} from "../repository";
import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

export class MpRepository {
  async getAllActive(user: User): Promise<DbMpMetadata[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI1",
      KeyConditionExpression: "entityType = :pk AND archived = :sk",
      ExpressionAttributeValues: {
        ":pk": "mp",
        ":sk": "N",
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

  async getAll(user: User): Promise<DbMpMetadata[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI1",
      KeyConditionExpression: "entityType = :pk",
      ExpressionAttributeValues: {
        ":pk": "mp",
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

  async getById(user: User, mpId: string): Promise<DbMpFull[]> {
    //mp's mplog record only useful here to simply get id of mplogs to fetch later in service
    const command = new QueryCommand({
      TableName: getTableName(user),
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

  async create(
    newMp: Omit<DbMpEntity, "pK" | "sK">,
    user: User
  ): Promise<string> {
    const uuid = uuidv4();
    const key = `mp#${uuid}`;
    const fullMp: DbMpEntity = { pK: key, sK: key, ...newMp };
    const validatedFullMp = dbMpEntity.parse(fullMp);
    const command = new PutCommand({
      TableName: getTableName(user),
      Item: addCreateMiddleware(validatedFullMp, user),
    });

    try {
      await client.send(command);
      return key;
    } catch (error) {
      console.error("Repository Layer Error creating mp:", error);
      throw error;
    }
  }

  async update(updatedMp: DbMpEntity, user: User): Promise<void> {
    const validatedFullMp = dbMpEntity.parse(updatedMp);
    const command = new PutCommand({
      TableName: getTableName(user),
      Item: addUpdateMiddleware(validatedFullMp, user),
    });

    try {
      await client.send(command);
    } catch (error) {
      console.error("Repository Layer Error updating mp:", error);
      throw error;
    }
  }

  async delete(user: User, mpId: string): Promise<number[]> {
    try {
      const mpData = await this.getById(user, mpId);
      let deletedCount = 0;

      for (const item of mpData) {
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
      console.error("Repository Layer Error deleting mp:", error);
      throw error;
    }
  }
}
