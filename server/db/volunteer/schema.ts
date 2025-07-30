import { z } from "zod";
import { volunteerMetadataSchema } from "shared";
import { dbTrainingRecord } from "../training/schema";
import { dbPackage } from "../package/schema";
import { dbMagLogVolunteer } from "../mag/schema";
import { dbEntrySchema } from "../schema";

export const dbVolunteerEntity = dbEntrySchema
  .extend(
    volunteerMetadataSchema
      .omit({
        id: true,
        trainingRecords: true,
      })
      .shape
  )
  .extend({
    entityType: z.literal("volunteer"),
  });

export const dbVolunteerMetadata = z.union([
  dbVolunteerEntity,
  dbTrainingRecord,
]);

export const dbVolunteerFull = z.union([
  dbVolunteerMetadata,
  dbPackage,
  dbMagLogVolunteer,
]);

export type DbVolunteerMetadata = z.infer<typeof dbVolunteerMetadata>;
export type DbVolunteerEntity = z.infer<typeof dbVolunteerEntity>;
export type DbVolunteerFull = z.infer<typeof dbVolunteerFull>;
