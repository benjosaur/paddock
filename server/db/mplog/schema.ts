import { z } from "zod";
import { mpLogSchema } from "shared";

export const dbMpLog = z.union([
  mpLogSchema
    .omit({
      id: true,
      clients: true,
      mps: true,
    })
    .extend({
      pK: z.string(),
      sK: z.string(),
      entityType: z.literal("mpLog"),
      entityOwner: z.literal("main"),
    }),
  //client
  mpLogSchema.shape.clients.element.omit({ id: true }).extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("mpLog"),
    entityOwner: z.literal("client"),
  }),
  //mp
  mpLogSchema.shape.mps.element.omit({ id: true }).extend({
    pK: z.string(),
    sK: z.string(),
    date: z.string().datetime(),
    entityType: z.literal("mpLog"),
    entityOwner: z.literal("mp"),
  }),
]);

export type DbMpLog = z.infer<typeof dbMpLog>;
