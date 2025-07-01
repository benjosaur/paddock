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
  TABLE_NAME,
  addCreateMiddleware,
  addUpdateMiddleware,
} from "../repository";
import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

export class MpRepository {
  async getAll(): Promise<DbMpMetadata[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "entityOwner = :pk AND entityType = :sk",
      ExpressionAttributeValues: {
        ":pk": "mp",
        ":sk": "mp",
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

  async getById(mpId: string): Promise<DbMpFull[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
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

  async create(newMp: Omit<DbMpEntity, "pK" | "sK">): Promise<DbMpFull[]> {
    const uuid = uuidv4();
    const key = `mp#${uuid}`;
    const fullMp: DbMpEntity = { pK: key, sK: key, ...newMp };
    const validatedFullMp = dbMpEntity.parse(fullMp);
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: addCreateMiddleware(validatedFullMp),
    });

    try {
      await client.send(command);
      const createdMp = await this.getById(key);
      return dbMpFull.array().parse(createdMp);
    } catch (error) {
      console.error("Repository Layer Error creating mp:", error);
      throw error;
    }
  }

  async update(updatedMp: DbMpEntity): Promise<DbMpFull[]> {
    const validatedFullMp = dbMpEntity.parse(updatedMp);
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: addUpdateMiddleware(validatedFullMp),
    });

    try {
      await client.send(command);
      const updatedMpData = await this.getById(updatedMp.pK);
      return updatedMpData;
    } catch (error) {
      console.error("Repository Layer Error updating mp:", error);
      throw error;
    }
  }

  async delete(mpId: string): Promise<number[]> {
    try {
      const mpData = await this.getById(mpId);
      let deletedCount = 0;

      for (const item of mpData) {
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
      console.error("Repository Layer Error deleting mp:", error);
      throw error;
    }
  }
}
