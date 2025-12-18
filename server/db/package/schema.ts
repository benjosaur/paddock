import { z } from "zod";
import { reqPackageSchema, solePackageSchema } from "shared";
import { dbEntrySchema } from "../schema";

export const dbReqPackage = dbEntrySchema.extend(
  reqPackageSchema.omit({
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

export const dbPackage = z.union([dbReqPackage, dbSolePackage]);

export type DbReqPackage = z.infer<typeof dbReqPackage>;
export type DbSolePackage = z.infer<typeof dbSolePackage>;
export type DbPackage = z.infer<typeof dbPackage>;
