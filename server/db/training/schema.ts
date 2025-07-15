import { trainingRecordSchema } from "shared";
import { z } from "zod";

export const dbTrainingRecord = trainingRecordSchema
  .omit({ id: true, ownerId: true })
  .extend({
    pK: z.string(), // m/v#
    sK: z.string(), // tr#
    entityType: z.literal("trainingRecord"),
  });

export type DbTrainingRecord = z.infer<typeof dbTrainingRecord>;
