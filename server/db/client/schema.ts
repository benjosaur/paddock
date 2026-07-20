import { z } from "zod";
import { clientMetadataSchema } from "shared";
import { dbAttachmentEntity } from "../attachment/schema";
import { dbMagLogClient } from "../mag/schema";
import { dbHubGrubLogClient } from "../hubGrub/schema";
import { dbRequestEntity } from "../requests/schema";
import { dbEntrySchema } from "../schema";

export const dbClientEntity = dbEntrySchema
  .extend(
    clientMetadataSchema
      .omit({
        id: true,
        requests: true,
      })
      .shape
  )
  .extend({
    entityType: z.literal("client"),
  });

export const dbClientMetadata = z.union([dbClientEntity, dbRequestEntity]);

export const dbClientFull = z.union([
  dbClientMetadata,
  dbMagLogClient,
  dbHubGrubLogClient,
  dbAttachmentEntity,
]);

export type DbClientEntity = z.infer<typeof dbClientEntity>;
export type DbClientMetadata = z.infer<typeof dbClientMetadata>;
export type DbClientFull = z.infer<typeof dbClientFull>;
