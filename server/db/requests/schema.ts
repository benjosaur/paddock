import { z } from "zod";

import { requestSchema } from "shared";

export const dbRequest = requestSchema
  .omit({ id: true, clientId: true })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z
      .string()
      .regex(
        /^request#(\d{4}|open)$/,
        "Must be 'request#yyyy' (4-digit year) or 'package#open'"
      ),
  });

export type DbRequest = z.infer<typeof dbRequest>;
