import { trainingRecordSchema } from "shared";
import { z } from "zod";

export const dbTrainingRecordEntity = trainingRecordSchema
  .omit({ id: true, owner: true })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("trainingRecord"),
    entityOwner: z.union([z.literal("mp"), z.literal("volunteer")]),
    recordName: z.string(),
    recordExpiry: z.string().datetime(),
    details: z.object({
      name: z.string(),
    }),
  });

export type DbTrainingRecordEntity = z.infer<typeof dbTrainingRecordEntity>;
