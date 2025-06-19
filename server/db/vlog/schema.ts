import { z } from "zod";
import { isoDate, floatString } from "../shared/schema";

export const vLogMetaSchema = z.object({
  pK: z.string(),
  sK: z.string(),
  entityType: z.literal("vLogMeta"),
  date: isoDate,
  details: z.object({
    hoursLogged: floatString,
    notes: z.string().optional(),
    activity: z.string().optional(),
  }),
});

export const vLogVolunteerSchema = z.object({
  pK: z.string(),
  sK: z.string(),
  entityType: z.literal("vLogVolunteer"),
  details: z.object({
    name: z.string(),
  }),
});

export const vLogClientSchema = z.object({
  pK: z.string(),
  sK: z.string(),
  entityType: z.literal("vLogClient"),
  postCode: z.string(),
  details: z.object({
    name: z.string(),
  }),
});

export const vLogMetaArraySchema = z.array(vLogMetaSchema);
