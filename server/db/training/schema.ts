import { trainingRecordSchema } from "shared";
import { z } from "zod";

export const dbTrainingRecordEntity = trainingRecordSchema
  .omit({ id: true, ownerId: true })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("trainingRecord"),
    entityOwner: z.union([z.literal("mp"), z.literal("volunteer")]),
  });

export type DbTrainingRecordEntity = z.infer<typeof dbTrainingRecordEntity>;
