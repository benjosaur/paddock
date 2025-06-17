import { z } from "zod";
import { baseDetailsSchema, isoDate, stringList } from "../shared/baseSchemas";

export const volunteerReceiptSchema = z.object({
  pK: z.string(),
  sK: z.string(),
  entityType: z.literal("volunteer"),
  dateOfBirth: isoDate,
  postCode: z.string(),
  details: baseDetailsSchema.extend({
    dbsNumber: z.string().regex(/^\d+$/, "Expected a number string").optional(),
    dbsExpiry: isoDate.optional(),
    specialisms: stringList.optional(),
    transport: z.boolean(),
    capacity: z.string().optional(),
  }),
});

export const volunteerUpdateSchema = volunteerReceiptSchema.partial();
export const volunteerReceiptArraySchema = z.array(volunteerReceiptSchema);
