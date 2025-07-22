import { months, serviceOptions } from "shared/const";
import { z } from "zod";

export const crossSectionSchema = z.object({
  totalHours: z.number().default(0),
  localities: z
    .array(
      z.object({
        name: z.string(),
        services: z.array(
          z.object({
            name: z.enum(serviceOptions),
            totalHours: z.number().default(0),
          })
        ),
        totalHours: z.number().default(0),
      })
    )
    .default([]),
  services: z
    .array(
      z.object({
        name: z.enum(serviceOptions),
        totalHours: z.number().default(0),
      })
    )
    .default([]),
});

export const reportMonthSchema = crossSectionSchema.extend({
  month: z.number(),
});

export const reportYearSchema = crossSectionSchema.extend({
  year: z.number(),
  months: z.array(reportMonthSchema),
});

export const reportSchema = z.object({
  years: z.array(reportYearSchema),
});

export type CrossSection = z.infer<typeof crossSectionSchema>;
export type ReportMonth = z.infer<typeof reportMonthSchema>;
export type ReportYear = z.infer<typeof reportYearSchema>;
export type Report = z.infer<typeof reportSchema>;
