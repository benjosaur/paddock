import { z } from "zod";

import { clientRequestSchema } from "shared";

export const dbClientMpRequestEntity = clientRequestSchema..object({
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

export const dbClientRequestEntity = z.union([
  dbClientMpRequestEntity,
  dbClientVolunteerRequestEntity,
]);

export type DbClientMpRequestEntity = z.infer<typeof dbClientMpRequestEntity>;
export type DbClientVolunteerRequestEntity = z.infer<
  typeof dbClientVolunteerRequestEntity
>;
export type DbClientRequestEntity = z.infer<typeof dbClientRequestEntity>;
