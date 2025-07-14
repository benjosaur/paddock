import { z } from "zod";
import { packageSchema } from "shared";

export const dbPackage = packageSchema
  .omit({
    id: true,
    carerId: true,
  })
  .extend({
    pK: z.string(), // m/v#
    sK: z.string(), // pkg#
    entityType: z
      .string()
      .regex(
        /^package#(\d{4}|open)$/,
        "Must be 'package#yyyy' (4-digit year) or 'package#open'"
      ),
  });

export type DbPackage = z.infer<typeof dbPackage>;
