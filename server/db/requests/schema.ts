import { z } from "zod";

import { requestSchema } from "shared";

export const dbRequest = requestSchema
  .omit({ id: true, clientId: true })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("request"),
  });

export type DbRequest = z.infer<typeof dbRequest>;
