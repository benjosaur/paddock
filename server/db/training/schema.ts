import { z } from "zod";

export const trainingRecordSchema = z.object({
  pK: z.string(),
  sK: z.string(),
  entityType: z.literal("trainingRecord"),
  recordName: z.string(),
  recordExpiry: isoDate,
  details: z.object({
    name: z.string(),
  }),
});

export const trainingRecordArraySchema = z.array(trainingRecordSchema);
