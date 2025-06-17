import { z } from "zod";
import { baseDetailsSchema, isoDate } from "../shared/baseSchemas";

export const clientReceiptSchema = z.object({
  pK: z.string(),
  sK: z.string(),
  entityType: z.literal("client"),
  dateOfBirth: isoDate,
  postCode: z.string(),
  details: baseDetailsSchema.extend({
    referredBy: z.string().optional(),
    clientAgreementDate: isoDate.optional(),
    clientAgreementComments: z.string().optional(),
    riskAssessmentDate: isoDate.optional(),
    riskAssessmentComments: z.string().optional(),
  }),
});

export const clientUpdateSchema = clientReceiptSchema.partial();
export const clientReceiptArraySchema = z.array(clientReceiptSchema);
