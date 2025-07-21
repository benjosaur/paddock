import { z } from "zod";
import { magLogSchema } from "shared";

export const dbMagLogEntity = magLogSchema
  .omit({
    id: true,
    clients: true,
    mps: true,
    volunteers: true,
  })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("magLogEntity"),
  });

export const dbMagLogClient = magLogSchema.shape.clients.element
  .omit({ id: true })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("magLogClient"),
  });

export const dbMagLogMp = magLogSchema.shape.mps.element
  .omit({ id: true })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("magLogMp"),
  });

export const dbMagLogVolunteer = magLogSchema.shape.volunteers.element
  .omit({ id: true })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("magLogVolunteer"),
  });

export const dbMagLog = z.discriminatedUnion("entityType", [
  dbMagLogEntity,
  dbMagLogClient,
  dbMagLogVolunteer,
  dbMagLogMp,
]);

export type DbMagLogEntity = z.infer<typeof dbMagLogEntity>;
export type DbMagLogClient = z.infer<typeof dbMagLogClient>;
export type DbMagLogVolunteer = z.infer<typeof dbMagLogVolunteer>;
export type DbMagLogMp = z.infer<typeof dbMagLogMp>;
export type DbMagLog = z.infer<typeof dbMagLog>;
