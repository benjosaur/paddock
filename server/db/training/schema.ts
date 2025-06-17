import { z } from "zod";
import { isoDate } from "../shared/baseSchemas";

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
