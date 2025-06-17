import { z } from "zod";
import {
  mpLogMetaSchema,
  mpLogClientSchema,
  mpLogMpSchema,
  mpLogMetaArraySchema,
} from "./schema";

export type MpLogMeta = z.infer<typeof mpLogMetaSchema>;
export type MpLogClient = z.infer<typeof mpLogClientSchema>;
export type MpLogMp = z.infer<typeof mpLogMpSchema>;
export type MpLogMetaArray = z.infer<typeof mpLogMetaArraySchema>;
