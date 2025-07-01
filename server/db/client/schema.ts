import { z } from "zod";
import { clientMetadataSchema } from "shared";
import {
  dbClientMpRequestEntity,
  dbClientVolunteerRequestEntity,
} from "../requests/schema";

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

export const dbClientMpLogEntity = z.object({
  pK: z.string(),
  sK: z.string(),
  entityOwner: z.literal("client"),
  entityType: z.literal("mpLog"),
  postCode: z.string(),
});
export const dbClientVolunteerLogEntity = z.object({
  pK: z.string(),
  sK: z.string(),
  entityOwner: z.literal("client"),
  entityType: z.literal("volunteerLog"),
  postCode: z.string(),
});
export const dbClientMagLogEntity = z.object({
  pK: z.string(),
  sK: z.string(),
  entityOwner: z.literal("client"),
  entityType: z.literal("magLog"),
  postCode: z.string(),
});

export const dbClientFull = z.union([
  dbClientMetadata,
  dbClientMpLogEntity,
  dbClientVolunteerLogEntity,
  dbClientMagLogEntity,
]);

export type DbClientMetadata = z.infer<typeof dbClientMetadata>;
export type DbClientEntity = z.infer<typeof dbClientEntity>;
export type DbClientFull = z.infer<typeof dbClientFull>;
export type DbClientMpLogEntity = z.infer<typeof dbClientMpLogEntity>;
export type DbClientVolunteerLogEntity = z.infer<
  typeof dbClientVolunteerLogEntity
>;
export type DbClientMagLogEntity = z.infer<typeof dbClientMagLogEntity>;
