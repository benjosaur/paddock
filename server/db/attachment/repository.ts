import { client, getTableName, dropNullFields } from "../repository";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { DbAttachmentEntity, dbAttachmentEntity } from "./schema";

export class AttachmentRepository {
  async listByOwner(
    ownerId: string,
    user: User
  ): Promise<DbAttachmentEntity[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
      KeyConditionExpression: "pK = :pk AND begins_with(sK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": ownerId,
        ":skPrefix": "att#",
      },
    });
    try {
      const result = await client.send(command);
      return dbAttachmentEntity.array().parse(result.Items);
    } catch (error) {
      console.error("Repository Layer Error listing attachments:", error);
      throw error;
    }
  }

  async getById(
    ownerId: string,
    attachmentId: string,
    user: User
  ): Promise<DbAttachmentEntity | null> {
    const command = new GetCommand({
      TableName: getTableName(user),
      Key: { pK: ownerId, sK: attachmentId },
    });
    try {
      const result = await client.send(command);
      if (!result.Item) return null;
      return dbAttachmentEntity.parse(result.Item);
    } catch (error) {
      console.error("Repository Layer Error getting attachment:", error);
      throw error;
    }
  }

  // Unlike other repositories the caller supplies the full key: the attachment
  // id is minted at presign time (it names the S3 object), before the row exists.
  async create(newAttachment: DbAttachmentEntity, user: User): Promise<void> {
    const validated = dbAttachmentEntity.parse(newAttachment);
    const command = new PutCommand({
      TableName: getTableName(user),
      Item: dropNullFields(validated),
    });
    try {
      await client.send(command);
    } catch (error) {
      console.error("Repository Layer Error creating attachment:", error);
      throw error;
    }
  }

  async delete(
    ownerId: string,
    attachmentId: string,
    user: User
  ): Promise<void> {
    const command = new DeleteCommand({
      TableName: getTableName(user),
      Key: { pK: ownerId, sK: attachmentId },
    });
    try {
      await client.send(command);
    } catch (error) {
      console.error("Repository Layer Error deleting attachment:", error);
      throw error;
    }
  }
}
