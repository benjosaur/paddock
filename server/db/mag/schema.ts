import { z } from "zod";
import { magLogSchema } from "shared";
import { dbEntrySchema } from "../schema";

export const dbMagLogEntity = dbEntrySchema
  .extend(
    magLogSchema
      .omit({
        id: true,
        clients: true,
        mps: true,
        volunteers: true,
      })
      .shape
  )
  .extend({
    entityType: z.literal("magLogEntity"),
  });

export const dbMagLogClient = dbEntrySchema
  .extend(
    magLogSchema.shape.clients.element
      .omit({ id: true })
      .shape
  )
  .extend({
    entityType: z.literal("magLogClient"),
  });

export const dbMagLogMp = dbEntrySchema
  .extend(
    magLogSchema.shape.mps.element
      .omit({ id: true })
      .shape
  )
  .extend({
    entityType: z.literal("magLogMp"),
  });

export const dbMagLogVolunteer = dbEntrySchema
  .extend(
    magLogSchema.shape.volunteers.element
      .omit({ id: true })
      .shape
  )
  .extend({
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
