import { attachmentSchema } from "shared";
import { z } from "zod";
import { dbEntrySchema } from "../schema";

// Stored under the owning entity's partition (pK = owner id, sK = att#<uuid>),
// like req#/mag# rows. details carries the S3 object key on top of the shared
// attachment shape; the key never leaves the server.
export const dbAttachmentEntity = dbEntrySchema
  .extend(
    attachmentSchema.omit({ id: true, ownerId: true, updatedAt: true }).shape
  )
  .extend({
    entityType: z.literal("attachment"),
    details: attachmentSchema.shape.details.extend({
      s3Key: z.string().min(1),
    }),
  });

export type DbAttachmentEntity = z.infer<typeof dbAttachmentEntity>;
