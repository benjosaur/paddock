import { z } from "zod";

import { clientRequestSchema } from "shared";

export const dbClientMpRequestEntity = clientRequestSchema
  .omit({ id: true, clientId: true, requestType: true, startDate: true })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityOwner: z.literal("client"),
    entityType: z.literal("clientMpRequest"),
    date: z.string().date(),
  });

export const dbClientVolunteerRequestEntity = clientRequestSchema
  .omit({ id: true, clientId: true, requestType: true, startDate: true })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityOwner: z.literal("client"),
    entityType: z.literal("clientVolunteerRequest"),
    date: z.string().date(),
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
