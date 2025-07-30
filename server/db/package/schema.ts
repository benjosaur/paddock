import { z } from "zod";
import { packageSchema } from "shared";
import { dbEntrySchema } from "../schema";

export const dbPackage = dbEntrySchema
  .extend(
    packageSchema
      .omit({
        id: true,
        carerId: true,
      })
      .shape
  );

export type DbPackage = z.infer<typeof dbPackage>;
