import { z } from "zod";
import { clientMetadataSchema } from "shared";
import { dbMagLogClient } from "../mag/schema";
import { dbRequest, dbRequestEntity } from "../requests/schema";
import { dbPackage } from "../package/schema";

export const dbClientEntity = clientMetadataSchema
  .omit({
    id: true,
    requests: true,
  })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("client"),
  });

export const dbClientMetadata = z.union([dbClientEntity, dbRequestEntity]);

export const dbClientFull = z.union([dbClientMetadata, dbMagLogClient]);

export type DbClientEntity = z.infer<typeof dbClientEntity>;
export type DbClientMetadata = z.infer<typeof dbClientMetadata>;
export type DbClientFull = z.infer<typeof dbClientFull>;
