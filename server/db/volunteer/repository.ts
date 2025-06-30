import {
  dbVolunteerMetadata,
  DbVolunteerMetadata,
  DbVolunteerFull,
  dbVolunteerFull,
  DbVolunteerEntity,
  dbVolunteerEntity,
} from "./schema";
import { client, TABLE_NAME } from "../repository";
import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

export class VolunteerRepository {
  async getAll(): Promise<DbVolunteerMetadata[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "entityOwner = :pk AND entityType = :sk",
      ExpressionAttributeValues: {
        ":pk": "volunteer",
        ":sk": "volunteer",
      },
    });
    try {
      const result = await client.send(command);
      const parsedResult = dbVolunteerMetadata.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting item:", error);
      throw error;
    }
  }

  async getById(volunteerId: string): Promise<DbVolunteerFull[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pK = :pk",
      ExpressionAttributeValues: {
        ":pk": volunteerId,
      },
    });

    try {
      const result = await client.send(command);
      const parsedResult = dbVolunteerFull.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting volunteer by ID:", error);
      throw error;
    }
  }

  async create(
    newVolunteer: Omit<DbVolunteerEntity, "pK" | "sK">
  ): Promise<DbVolunteerFull[]> {
    const uuid = uuidv4();
    const key = `v#${uuid}`;
    const fullVolunteer: DbVolunteerEntity = {
      pK: key,
      sK: key,
      ...newVolunteer,
    };
    const validatedFullVolunteer = dbVolunteerEntity.parse(fullVolunteer);
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: validatedFullVolunteer,
    });

    try {
      await client.send(command);
      const createdVolunteer = await this.getById(key);
      return dbVolunteerFull.array().parse(createdVolunteer);
    } catch (error) {
      console.error("Repository Layer Error creating volunteer:", error);
      throw error;
    }
  }

  async update(
    updatedVolunteer: DbVolunteerEntity
  ): Promise<DbVolunteerFull[]> {
    const validatedFullVolunteer = dbVolunteerEntity.parse(updatedVolunteer);
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: validatedFullVolunteer,
    });

    try {
      await client.send(command);
      const updatedVolunteerData = await this.getById(updatedVolunteer.pK);
      return updatedVolunteerData;
    } catch (error) {
      console.error("Repository Layer Error updating volunteer:", error);
      throw error;
    }
  }

  async delete(volunteerId: string): Promise<number[]> {
    try {
      const volunteerData = await this.getById(volunteerId);
      let deletedCount = 0;

      for (const item of volunteerData) {
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
      console.error("Repository Layer Error deleting volunteer:", error);
      throw error;
    }
  }
}
