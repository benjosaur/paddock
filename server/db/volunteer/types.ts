import { z } from "zod";
import {
  volunteerReceiptSchema,
  volunteerUpdateSchema,
  volunteerReceiptArraySchema,
} from "./schema";

export type VolunteerReceipt = z.infer<typeof volunteerReceiptSchema>;
export type VolunteerUpdate = z.infer<typeof volunteerUpdateSchema>;
export type VolunteerReceiptArray = z.infer<typeof volunteerReceiptArraySchema>;
