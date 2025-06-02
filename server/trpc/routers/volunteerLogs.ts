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
    return await ctx.db.findAll<VolunteerLog>("volunteer_logs");
  }),

  getById: publicProcedure
    .input(idParamSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.db.findById<VolunteerLog>("volunteer_logs", input.id);
    }),

  getByVolunteerId: publicProcedure
    .input(z.object({ volunteerId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query(
        "SELECT * FROM volunteer_logs WHERE volunteer_id = $1 ORDER BY date DESC",
        [input.volunteerId]
      );
      return result.rows;
    }),

  getByClientId: publicProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query(
        "SELECT * FROM volunteer_logs WHERE client_id = $1 ORDER BY date DESC",
        [input.clientId]
      );
      return result.rows;
    }),

  create: publicProcedure
    .input(createVolunteerLogSchema)
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      return await ctx.db.create<VolunteerLog>("volunteer_logs", {
        id,
        ...input,
      });
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
