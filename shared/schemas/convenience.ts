// schemas for convenience functionality, wrapping core functionality

import { z } from "zod";
import { clientMetadataSchema, trainingRecordSchema } from ".";
import { coreTrainingRecordTypes, serviceOptions } from "../const";

export const coverDetailsSchema = z.object({
  carerId: z.string(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  // below counted as surplus over current weekly hours.
  oneOffStartDateHours: z.number().default(0),
});

// below ends up as same as note type, but we want the actual note input to be optional
export const infoDetailsSchema = clientMetadataSchema.shape.details.shape.notes
  .removeDefault()
  .element.omit({ note: true })
  .extend({
    completedBy: z.object({
      id: z.string().default(""),
      name: z.string().default(""),
    }),
    date: z.string().date(),
    note: z.string().default(""),
    services: z.array(z.enum(serviceOptions)).default([]),
  });

export const endRequestDetailsSchema = z.object({
  requestId: z.string(),
  endDate: z.string().date(),
});

export const endPersonDetailsSchema = z.object({
  personId: z.string(),
  endDate: z.string().date(),
});

export const endPackageDetailsSchema = z.object({
  packageId: z.string(),
  endDate: z.string().date(),
});

export const endTrainingRecordDetailsSchema = z.object({
  ownerId: z.string(),
  recordId: z.string(),
  endDate: z.string().date(),
});

export const analyticsDetailsSchema = z.object({
  startYear: z.number().min(2000).max(2100).default(new Date().getFullYear()),
  isInfo: z.boolean().default(false),
});

export const coreTrainingRecordCompletionSchema = z.object({
  carer: z.object({
    id: z.string(),
    name: z.string(),
  }),
  coreCompletionRate: z.coerce.number().min(0).default(0),
  earliestCompletionDate: z
    .union([z.string().date(), z.literal("")])
    .default(""),
  coreRecords: z.array(
    // all this does is narrow recordName field type -- everything else identical
    trainingRecordSchema.omit({ details: true }).extend({
      details: z.object({
        ...trainingRecordSchema.shape.details
          .omit({ recordName: true })
          .extend({
            recordName: z.enum(coreTrainingRecordTypes),
          }).shape,
      }),
    })
  ),
});

export type AnalyticsDetails = z.infer<typeof analyticsDetailsSchema>;
export type CoverDetails = z.infer<typeof coverDetailsSchema>;
export type InfoDetails = z.infer<typeof infoDetailsSchema>;
export type EndRequestDetails = z.infer<typeof endRequestDetailsSchema>;
export type EndPersonDetails = z.infer<typeof endPersonDetailsSchema>;
export type EndPackageDetails = z.infer<typeof endPackageDetailsSchema>;
export type EndTrainingRecordDetails = z.infer<
  typeof endTrainingRecordDetailsSchema
>;
export type CoreTrainingRecordCompletion = z.infer<
  typeof coreTrainingRecordCompletionSchema
>;
