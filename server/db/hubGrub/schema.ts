import { z } from "zod";
import { hubGrubLogSchema } from "shared";
import { dbEntrySchema } from "../schema";

export const dbHubGrubLogEntity = dbEntrySchema
  .extend(
    hubGrubLogSchema
      .omit({
        id: true,
        clients: true,
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
]);

export type DbHubGrubLogEntity = z.infer<typeof dbHubGrubLogEntity>;
export type DbHubGrubLogClient = z.infer<typeof dbHubGrubLogClient>;
export type DbHubGrubLogVolunteer = z.infer<typeof dbHubGrubLogVolunteer>;
export type DbHubGrubLog = z.infer<typeof dbHubGrubLog>;
