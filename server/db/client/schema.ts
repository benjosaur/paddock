import { z } from "zod";
import { clientMetadataSchema } from "shared";

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

export const dbClientMpRequestEntity = z.object({
  pK: z.string(),
  sK: z.string(),
  entityOwner: z.literal("client"),
  entityType: z.literal("clientMpRequest"),
  date: z.string(),
  details: z.object({ name: z.string(), notes: z.string().default("") }),
});

export const dbClientVolunteerRequestEntity = z.object({
  pK: z.string(),
  sK: z.string(),
  entityOwner: z.literal("client"),
  entityType: z.literal("clientVolunteerRequest"),
  date: z.string(),
  details: z.object({ name: z.string(), notes: z.string().default("") }),
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
export type DbClientMpRequestEntity = z.infer<typeof dbClientMpRequestEntity>;
export type DbClientVolunteerRequestEntity = z.infer<
  typeof dbClientVolunteerRequestEntity
>;
export type DbClientFull = z.infer<typeof dbClientFull>;
export type DbClientMpLogEntity = z.infer<typeof dbClientMpLogEntity>;
export type DbClientVolunteerLogEntity = z.infer<
  typeof dbClientVolunteerLogEntity
>;
export type DbClientMagLogEntity = z.infer<typeof dbClientMagLogEntity>;
