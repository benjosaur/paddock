import { z } from "zod";
import { mpLogSchema } from "shared";

export const dbMpLogEntity = mpLogSchema
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
  });

export const dbMpLogClient = mpLogSchema.shape.clients.element
  .omit({ id: true })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("mpLog"),
    entityOwner: z.literal("client"),
    date: z.string().date(),
  });

export const dbMpLogMp = mpLogSchema.shape.mps.element
  .omit({ id: true })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("mpLog"),
    entityOwner: z.literal("mp"),
    date: z.string().date(),
  });

export const dbMpLog = z.union([dbMpLogEntity, dbMpLogClient, dbMpLogMp]);

export type DbMpLogEntity = z.infer<typeof dbMpLogEntity>;
export type DbMpLogClient = z.infer<typeof dbMpLogClient>;
export type DbMpLogMp = z.infer<typeof dbMpLogMp>;
export type DbMpLog = z.infer<typeof dbMpLog>;
