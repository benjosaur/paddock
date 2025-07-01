import { z } from "zod";
import { volunteerLogSchema } from "shared";

export const dbVolunteerLogEntity = volunteerLogSchema
  .omit({
    id: true,
    clients: true,
    volunteers: true,
  })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("volunteerLog"),
    entityOwner: z.literal("main"),
  });

export const dbVolunteerLogClient = volunteerLogSchema.shape.clients.element
  .omit({ id: true })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("volunteerLog"),
    entityOwner: z.literal("client"),
    date: z.string().datetime(),
  });

export const dbVolunteerLogVolunteer =
  volunteerLogSchema.shape.volunteers.element.omit({ id: true }).extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("volunteerLog"),
    entityOwner: z.literal("volunteer"),
    date: z.string().datetime(),
  });

export const dbVolunteerLog = z.union([
  dbVolunteerLogEntity,
  dbVolunteerLogClient,
  dbVolunteerLogVolunteer,
]);

export type DbVolunteerLogEntity = z.infer<typeof dbVolunteerLogEntity>;
export type DbVolunteerLogClient = z.infer<typeof dbVolunteerLogClient>;
export type DbVolunteerLogVolunteer = z.infer<typeof dbVolunteerLogVolunteer>;
export type DbVolunteerLog = z.infer<typeof dbVolunteerLog>;
