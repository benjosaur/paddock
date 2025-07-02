import { z } from "zod";
import { volunteerMetadataSchema } from "shared";
import { dbTrainingRecordEntity } from "../training/schema";
import { dbVolunteerLogVolunteer } from "../vlog/schema";

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

export const dbVolunteerTrainingRecordEntity = dbTrainingRecordEntity
  .omit({
    entityOwner: true,
  })
  .extend({
    entityOwner: z.literal("volunteer"),
  });

export const dbVolunteerMetadata = z.union([
  dbVolunteerEntity,
  dbVolunteerTrainingRecordEntity,
]);

export const dbVolunteerFull = z.union([
  dbVolunteerMetadata,
  dbVolunteerLogVolunteer,
]);

export type DbVolunteerMetadata = z.infer<typeof dbVolunteerMetadata>;
export type DbVolunteerEntity = z.infer<typeof dbVolunteerEntity>;
export type DbVolunteerTrainingRecordEntity = z.infer<
  typeof dbVolunteerTrainingRecordEntity
>;
export type DbVolunteerFull = z.infer<typeof dbVolunteerFull>;
