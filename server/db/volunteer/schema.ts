import { z } from "zod";
import { volunteerMetadataSchema } from "shared";

export const dbVolunteerMetadata = volunteerMetadataSchema
  .omit({
    id: true,
  })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("volunteer"),
    entityOwner: z.literal("volunteer"),
  });

export const dbVolunteerFull = z.union([
  dbVolunteerMetadata,
  //mplog
  z.object({
    pK: z.string(),
    sK: z.string(),
    entityOwner: z.literal("volunteer"),
    entityType: z.literal("volunteerLog"),
    date: z.string(),
    details: z.object({ name: z.string(), notes: z.string().default("") }),
  }),
  //training record
  z.object({
    pK: z.string(),
    sK: z.string(),
    entityOwner: z.literal("volunteer"),
    entityType: z.literal("trainingRecord"),
    recordName: z.string().default(""),
    recordExpiry: z
      .union([z.string().datetime(), z.literal("n/a")])
      .default("n/a"),
  }),
]);

export type DbVolunteerMetadata = z.infer<typeof dbVolunteerMetadata>;
export type DbVolunteerFull = z.infer<typeof dbVolunteerFull>;
