import { z } from "zod";
import { mpMetadataSchema } from "shared";

export const dbMpMetadata = mpMetadataSchema
  .omit({
    id: true,
  })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("mp"),
    entityOwner: z.literal("mp"),
  });

export const dbMpFull = z.union([
  dbMpMetadata,
  //mplog
  z.object({
    pK: z.string(),
    sK: z.string(),
    entityOwner: z.literal("mp"),
    entityType: z.literal("mpLog"),
    date: z.string(),
    details: z.object({ name: z.string(), notes: z.string().default("") }),
  }),
  //training record
  z.object({
    pK: z.string(),
    sK: z.string(),
    entityOwner: z.literal("mp"),
    entityType: z.literal("trainingRecord"),
    recordName: z.string(),
    recordExpiry: z.union([z.string().datetime(), z.literal("never")]),
  }),
]);

export type DbMpMetadata = z.infer<typeof dbMpMetadata>;
export type DbMpFull = z.infer<typeof dbMpFull>;
