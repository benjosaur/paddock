import { z } from "zod";

import { requestMetadataSchema } from "shared";
import { dbReqPackage } from "../package/schema";
import { dbEntrySchema } from "../schema";

export const dbRequestEntity = dbEntrySchema
  .extend(requestMetadataSchema.omit({ id: true, clientId: true }).shape)
  .extend({
    // below is actually same as pK but just for indexing purposes it is repeated as "requestId"
    requestId: z.string(),
    // .regex(
    //   /^request#(\d{4}|open)$/,
    //   "Must be 'request#yyyy' (4-digit year) or 'request#open'"
    // ),
  });

export const dbRequest = z.union([dbRequestEntity, dbReqPackage]); // sole packages dont appear in req GSI query.

export type DbRequestEntity = z.infer<typeof dbRequestEntity>;
export type DbRequest = z.infer<typeof dbRequest>;
