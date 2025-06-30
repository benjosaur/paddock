import { z } from "zod";
import { volunteerMetadataSchema } from "shared";

export const dbVolunteerEntity = volunteerMetadataSchema
  .omit({
    id: true,
    trainingRecords: true,
  })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("volunteer"),
    entityOwner: z.literal("volunteer"),
  });

export const dbVolunteerTrainingRecordEntity = z.object({
  pK: z.string(),
  sK: z.string(),
  entityOwner: z.literal("volunteer"),
  entityType: z.literal("trainingRecord"),
  recordName: z.string().default(""),
  recordExpiry: z
    .union([z.string().datetime(), z.literal("never")])
    .default(""),
});

export const dbVolunteerMetadata = z.union([
  dbVolunteerEntity,
  dbVolunteerTrainingRecordEntity,
]);

export const dbVolunteerLogEntity = z.object({
  pK: z.string(),
  sK: z.string(),
  entityOwner: z.literal("volunteer"),
  entityType: z.literal("volunteerLog"),
  date: z.string(),
  details: z.object({ name: z.string(), notes: z.string().default("") }),
});

export const dbVolunteerFull = z.union([
  dbVolunteerMetadata,
  dbVolunteerLogEntity,
]);

export type DbVolunteerMetadata = z.infer<typeof dbVolunteerMetadata>;
export type DbVolunteerEntity = z.infer<typeof dbVolunteerEntity>;
export type DbVolunteerTrainingRecordEntity = z.infer<
  typeof dbVolunteerTrainingRecordEntity
>;
export type DbVolunteerLogEntity = z.infer<typeof dbVolunteerLogEntity>;
export type DbVolunteerFull = z.infer<typeof dbVolunteerFull>;
