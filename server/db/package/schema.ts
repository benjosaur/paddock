import { z } from "zod";
import { packageSchema, solePackageSchema } from "shared";
import { dbEntrySchema } from "../schema";

export const dbPackage = dbEntrySchema.extend(
  packageSchema.omit({
    id: true,
    carerId: true,
  }).shape
);

export const dbSolePackage = dbEntrySchema.extend(
  solePackageSchema.omit({
    id: true,
    carerId: true,
  }).shape
);

export type DbPackage = z.infer<typeof dbPackage>;
export type DbSolePackage = z.infer<typeof dbSolePackage>;
