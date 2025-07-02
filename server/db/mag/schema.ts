import { z } from "zod";
import { magLogSchema } from "shared";

export const dbMagLogEntity = magLogSchema
  .omit({
    id: true,
    clients: true,
  })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("magLog"),
    entityOwner: z.literal("main"),
  });

export const dbMagLogClient = magLogSchema.shape.clients.element
  .omit({ id: true })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("magLog"),
    entityOwner: z.literal("client"),
  });

export const dbMagLog = z.union([dbMagLogEntity, dbMagLogClient]);

export type DbMagLogEntity = z.infer<typeof dbMagLogEntity>;
export type DbMagLogClient = z.infer<typeof dbMagLogClient>;
export type DbMagLog = z.infer<typeof dbMagLog>;
