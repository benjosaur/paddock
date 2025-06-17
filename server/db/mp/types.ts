import { z } from "zod";
import {
  mpReceiptSchema,
  mpUpdateSchema,
  mpReceiptArraySchema,
} from "./schema";

export type MpReceipt = z.infer<typeof mpReceiptSchema>;
export type MpUpdate = z.infer<typeof mpUpdateSchema>;
export type MpReceiptArray = z.infer<typeof mpReceiptArraySchema>;
