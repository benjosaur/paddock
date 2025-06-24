import { z } from "zod";
import { volunteerLogSchema } from "shared";

export const dbVolunteerLog = z.union([
  volunteerLogSchema
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
    }),
  //client
  volunteerLogSchema.shape.clients.element.omit({ id: true }).extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("volunteerLog"),
    entityOwner: z.literal("client"),
  }),
  //volunteer
  volunteerLogSchema.shape.volunteers.element.omit({ id: true }).extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("volunteerLog"),
    entityOwner: z.literal("volunteer"),
  }),
]);

export type DbVolunteerLog = z.infer<typeof dbVolunteerLog>;
