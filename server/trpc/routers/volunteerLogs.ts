import { router, publicProcedure } from "../trpc.ts";
import {
  createVolunteerLogSchema,
  updateVolunteerLogSchema,
  idParamSchema,
  volunteerLogSchema,
} from "shared/schemas/index.ts";
import type { VolunteerLog } from "shared/types/index.ts";
import { keysToCamel } from "../../utils/caseConverter.ts";

export const volunteerLogsRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.findAll<VolunteerLog>("volunteer_logs");
  }),

  getById: publicProcedure
    .input(idParamSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.db.findById<VolunteerLog>("volunteer_logs", input.id);
    }),

  getByVolunteerId: publicProcedure
    .input(volunteerLogSchema.pick({ volunteerId: true }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query(
        "SELECT * FROM volunteer_logs WHERE volunteer_id = $1 ORDER BY date DESC",
        [input.volunteerId]
      );
      return keysToCamel(result.rows);
    }),

  getByClientId: publicProcedure
    .input(volunteerLogSchema.pick({ clientId: true }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query(
        "SELECT * FROM volunteer_logs WHERE client_id = $1 ORDER BY date DESC",
        [input.clientId]
      );
      return keysToCamel(result.rows);
    }),

  create: publicProcedure
    .input(createVolunteerLogSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.create<VolunteerLog>("volunteer_logs", input);
    }),

  update: publicProcedure
    .input(updateVolunteerLogSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.update<VolunteerLog>("volunteer_logs", id, data);
    }),

  delete: publicProcedure
    .input(idParamSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete("volunteer_logs", input.id);
    }),
});
