import { z } from "zod";
import {
  magLogSchema,
  magClientLogSchema,
  magLogArraySchema,
  magClientLogArraySchema,
} from "./schema";

export type MagLog = z.infer<typeof magLogSchema>;
export type MagClientLog = z.infer<typeof magClientLogSchema>;
export type MagLogArray = z.infer<typeof magLogArraySchema>;
export type MagClientLogArray = z.infer<typeof magClientLogArraySchema>;
