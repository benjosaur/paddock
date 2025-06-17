import { z } from "zod";
import { baseDetailsSchema, isoDate, stringList } from "../shared/baseSchemas";

export const mpReceiptSchema = z.object({
  pK: z.string(),
  sK: z.string(),
  entityType: z.literal("mp"),
  dateOfBirth: isoDate,
  postCode: z.string(),
  recordName: z.string().optional(),
  recordExpiry: isoDate.optional(),
  details: baseDetailsSchema.extend({
    specialisms: stringList.optional(),
    transport: z.boolean(),
    capacity: z.string().optional(),
  }),
});

export const mpUpdateSchema = mpReceiptSchema.partial();
export const mpReceiptArraySchema = z.array(mpReceiptSchema);
