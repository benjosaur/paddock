import { trainingRecordSchema } from "shared";
import { z } from "zod";
import { dbEntrySchema } from "../schema";

export const dbTrainingRecord = dbEntrySchema
  .extend(
    trainingRecordSchema
      .omit({ id: true, ownerId: true })
      .shape
  )
  .extend({
    entityType: z.literal("trainingRecord"),
  });

export type DbTrainingRecord = z.infer<typeof dbTrainingRecord>;
