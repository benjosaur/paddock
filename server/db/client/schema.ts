import { z } from "zod";
import { clientMetadataSchema } from "shared";

export const dbClientMetadata = z.union([
  clientMetadataSchema
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
    }),
  //mprequest
  z.object({
    pK: z.string(),
    sK: z.string(),
    entityOwner: z.literal("client"),
    entityType: z.literal("clientMpRequest"),
    date: z.string(),
    details: z.object({ name: z.string(), notes: z.string().default("") }),
  }),
  //vrequest
  z.object({
    pK: z.string(),
    sK: z.string(),
    entityOwner: z.literal("client"),
    entityType: z.literal("clientVolunteerRequest"),
    date: z.string(),
    details: z.object({ name: z.string(), notes: z.string().default("") }),
  }),
]);

export const dbClientFull = z.union([
  dbClientMetadata,
  //mplog
  z.object({
    pK: z.string(),
    sK: z.string(),
    entityOwner: z.literal("client"),
    entityType: z.literal("mpLog"),
    postCode: z.string(),
  }),
  //vlog
  z.object({
    pK: z.string(),
    sK: z.string(),
    entityOwner: z.literal("client"),
    entityType: z.literal("volunteerLog"),
    postCode: z.string(),
  }),
  //maglog
  z.object({
    pK: z.string(),
    sK: z.string(),
    entityOwner: z.literal("client"),
    entityType: z.literal("magLog"),
  }),
]);

export type DbClientMetadata = z.infer<typeof dbClientMetadata>;
export type DbClientFull = z.infer<typeof dbClientFull>;
