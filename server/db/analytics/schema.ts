import { serviceOptions } from "shared/const";
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

export const yearSchema = crossSectionSchema.extend({
  year: z.string().regex(/^\d{4}$/),
  months: z.record(
    z.enum([
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]),
    crossSectionSchema.default({ totalHours: 0 })
  ),
});

export const reportSchema = z.object({
  years: z.array(yearSchema),
});

export type CrossSection = z.infer<typeof crossSectionSchema>;
export type Report = z.infer<typeof reportSchema>;
