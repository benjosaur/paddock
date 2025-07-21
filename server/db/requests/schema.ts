import { z } from "zod";

import { requestMetadataSchema } from "shared";
import { dbPackage } from "../package/schema";

export const dbRequestEntity = requestMetadataSchema
  .omit({ id: true, clientId: true })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.string(),
    // below is actually same as pK but just for indexing purposes
    requestId: z.string(),
    // .regex(
    //   /^request#(\d{4}|open)$/,
    //   "Must be 'request#yyyy' (4-digit year) or 'request#open'"
    // ),
  });

export const dbRequest = z.union([dbRequestEntity, dbPackage]);

export type DbRequestEntity = z.infer<typeof dbRequestEntity>;
export type DbRequest = z.infer<typeof dbRequest>;
