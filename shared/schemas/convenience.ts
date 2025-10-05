// schemas for convenience functionality, wrapping core functionality

import { z } from "zod";
import { clientMetadataSchema } from ".";
import { serviceOptions } from "../const";

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

export const analyticsDetailsSchema = z.object({
  startYear: z.number().min(2000).max(2100).default(new Date().getFullYear()),
  isInfo: z.boolean().default(false),
});

export type AnalyticsDetails = z.infer<typeof analyticsDetailsSchema>;
export type CoverDetails = z.infer<typeof coverDetailsSchema>;
export type InfoDetails = z.infer<typeof infoDetailsSchema>;
export type EndRequestDetails = z.infer<typeof endRequestDetailsSchema>;
export type EndPersonDetails = z.infer<typeof endPersonDetailsSchema>;
