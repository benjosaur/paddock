import { z } from "zod";
import { isoDate, floatString } from "../shared/baseResponses";

export const magLogResponse = z.object({
  pK: z.string(),
  sK: z.string(),
  entityType: z.literal("magLog"),
  date: isoDate,
  details: z.object({
    totalAttendees: floatString.optional(),
  }),
});

export const magClientLogResponse = z.object({
  pK: z.string(),
  sK: z.string(),
  entityType: z.literal("magClientLog"),
  details: z.object({
    name: z.string(),
  }),
});

export const magLogArrayResponse = z.array(magLogResponse);
export const magClientLogArrayResponse = z.array(magClientLogResponse);
