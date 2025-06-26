import { z } from "zod";
import { magLogSchema } from "shared";

export const dbMagLog = z.union([
  magLogSchema
    .omit({
      id: true,
      clients: true,
    })
    .extend({
      pK: z.string(),
      sK: z.string(),
      entityType: z.literal("magLog"),
      entityOwner: z.literal("main"),
    }),
  //client
  magLogSchema.shape.clients.element.omit({ id: true }).extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("magLog"),
    entityOwner: z.literal("client"),
  }),
]);

export type DbMagLog = z.infer<typeof dbMagLog>;
