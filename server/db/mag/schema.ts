import { z } from "zod";
import { isoDate, floatString } from "../shared/baseSchemas";

export const magLogSchema = z.object({
  pK: z.string(),
  sK: z.string(),
  entityType: z.literal("magLog"),
  date: isoDate,
  details: z.object({
    totalAttendees: floatString.optional(),
  }),
});

export const magClientLogSchema = z.object({
  pK: z.string(),
  sK: z.string(),
  entityType: z.literal("magClientLog"),
  details: z.object({
    name: z.string(),
  }),
});

export const magLogArraySchema = z.array(magLogSchema);
export const magClientLogArraySchema = z.array(magClientLogSchema);
