import { z } from "zod";
import {
  vLogMetaSchema,
  vLogVolunteerSchema,
  vLogClientSchema,
  vLogMetaArraySchema,
} from "./schema";

export type VLogMeta = z.infer<typeof vLogMetaSchema>;
export type VLogVolunteer = z.infer<typeof vLogVolunteerSchema>;
export type VLogClient = z.infer<typeof vLogClientSchema>;
export type VLogMetaArray = z.infer<typeof vLogMetaArraySchema>;
