import { z } from "zod";
import {
  clientReceiptSchema,
  clientUpdateSchema,
  clientReceiptArraySchema,
} from "./schema";

export type ClientReceipt = z.infer<typeof clientReceiptSchema>;
export type ClientUpdate = z.infer<typeof clientUpdateSchema>;
export type ClientReceiptArray = z.infer<typeof clientReceiptArraySchema>;
