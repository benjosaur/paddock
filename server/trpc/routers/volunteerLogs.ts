import { z } from "zod";
import { router, publicProcedure } from "../trpc.ts";
import {
  createVolunteerLogSchema,
  updateVolunteerLogSchema,
  idParamSchema,
} from "shared/schemas/index.ts";
import type { VolunteerLog } from "shared/types/index.ts";

export const volunteerLogsRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.findAll<VolunteerLog>("volunteerLogs");
  }),

  getById: publicProcedure
    .input(idParamSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.db.findById<VolunteerLog>("volunteerLogs", input.id);
    }),

  getByVolunteerId: publicProcedure
    .input(z.object({ volunteerId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query(
        "SELECT * FROM volunteerLogs WHERE volunteerId = $1 ORDER BY date DESC",
        [input.volunteerId]
      );
      return result.rows;
    }),

  getByClientId: publicProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query(
        "SELECT * FROM volunteerLogs WHERE clientId = $1 ORDER BY date DESC",
        [input.clientId]
      );
      return result.rows;
    }),

  create: publicProcedure
    .input(createVolunteerLogSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.create<VolunteerLog>("volunteerLogs", input);
    }),

  update: publicProcedure
    .input(updateVolunteerLogSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.update<VolunteerLog>("volunteerLogs", id, data);
    }),

  delete: publicProcedure
    .input(idParamSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete("volunteerLogs", input.id);
    }),
});
