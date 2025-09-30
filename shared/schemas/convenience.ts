// schemas for convenience functionality, wrapping core functionality

import { z } from "zod";

export const coverDetailsSchema = z.object({
  carerId: z.string(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  // below counted as surplus over current weekly hours.
  oneOffStartDateHours: z.number().default(0),
});

export type CoverDetails = z.infer<typeof coverDetailsSchema>;
