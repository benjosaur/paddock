// schemas for convenience functionality, wrapping core functionality

import { z } from "zod";
import { clientMetadataSchema } from ".";
import { notesSource } from "../const";

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
  .extend({ note: z.string().default("") });

export type CoverDetails = z.infer<typeof coverDetailsSchema>;
export type InfoDetails = z.infer<typeof infoDetailsSchema>;
