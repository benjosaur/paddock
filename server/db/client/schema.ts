import { z } from "zod";
import { clientMetadataSchema } from "shared";
import {
  dbClientMpRequestEntity,
  dbClientVolunteerRequestEntity,
} from "../requests/schema";
import { dbMpLogClient } from "../mplog/schema";
import { dbVolunteerLogClient } from "../vlog/schema";
import { dbMagLogClient } from "../mag/schema";

export const dbClientEntity = clientMetadataSchema
  .omit({
    id: true,
    mpRequests: true,
    volunteerRequests: true,
  })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("client"),
    entityOwner: z.literal("client"),
  });

export const dbClientMetadata = z.union([
  dbClientEntity,
  dbClientMpRequestEntity,
  dbClientVolunteerRequestEntity,
]);

export const dbClientFull = z.union([
  dbClientMetadata,
  dbMpLogClient,
  dbVolunteerLogClient,
  dbMagLogClient,
]);

export type DbClientEntity = z.infer<typeof dbClientEntity>;
export type DbClientMetadata = z.infer<typeof dbClientMetadata>;
export type DbClientFull = z.infer<typeof dbClientFull>;
