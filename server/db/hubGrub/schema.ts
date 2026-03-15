import { z } from "zod";
import { hubGrubLogSchema } from "shared";
import { dbEntrySchema } from "../schema";

export const dbHubGrubLogEntity = dbEntrySchema
  .extend(
    hubGrubLogSchema
      .omit({
        id: true,
        clients: true,
        mps: true,
        volunteers: true,
      })
      .shape
  )
  .extend({
    entityType: z.literal("hubGrubLogEntity"),
  });

export const dbHubGrubLogClient = dbEntrySchema
  .extend(
    hubGrubLogSchema.shape.clients.element
      .omit({ id: true })
      .shape
  )
  .extend({
    entityType: z.literal("hubGrubLogClient"),
  });

export const dbHubGrubLogMp = dbEntrySchema
  .extend(
    hubGrubLogSchema.shape.mps.element
      .omit({ id: true })
      .shape
  )
  .extend({
    entityType: z.literal("hubGrubLogMp"),
  });

export const dbHubGrubLogVolunteer = dbEntrySchema
  .extend(
    hubGrubLogSchema.shape.volunteers.element
      .omit({ id: true })
      .shape
  )
  .extend({
    entityType: z.literal("hubGrubLogVolunteer"),
  });

export const dbHubGrubLog = z.discriminatedUnion("entityType", [
  dbHubGrubLogEntity,
  dbHubGrubLogClient,
  dbHubGrubLogVolunteer,
  dbHubGrubLogMp,
]);

export type DbHubGrubLogEntity = z.infer<typeof dbHubGrubLogEntity>;
export type DbHubGrubLogClient = z.infer<typeof dbHubGrubLogClient>;
export type DbHubGrubLogVolunteer = z.infer<typeof dbHubGrubLogVolunteer>;
export type DbHubGrubLogMp = z.infer<typeof dbHubGrubLogMp>;
export type DbHubGrubLog = z.infer<typeof dbHubGrubLog>;
