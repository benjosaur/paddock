import { z } from "zod";
import { isoDate, floatString, stringList } from "../shared/schema";

export const mpLogMetaSchema = z.object({
  pK: z.string(),
  sK: z.string(),
  entityType: z.literal("mpLogMeta"),
  date: isoDate,
  details: z.object({
    hoursLogged: floatString,
    notes: z.string().optional(),
    services: stringList.optional(),
  }),
});

export const mpLogClientSchema = z.object({
  pK: z.string(),
  sK: z.string(),
  entityType: z.literal("mpLogClient"),
  postCode: z.string(),
  details: z.object({
    name: z.string(),
  }),
});

export const mpLogMpSchema = z.object({
  pK: z.string(),
  sK: z.string(),
  entityType: z.literal("mpLogMp"),
  details: z.object({
    name: z.string(),
  }),
});

export const mpLogMetaArraySchema = z.array(mpLogMetaSchema);
