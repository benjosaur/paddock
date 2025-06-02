import { z } from "zod";
import { router, publicProcedure } from "../trpc.ts";
import {
  createVolunteerSchema,
  updateVolunteerSchema,
  idParamSchema,
} from "shared/schemas/index.ts";
import type { Volunteer } from "shared/types/index.ts";

export const volunteersRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.findAll<Volunteer>("volunteers");
  }),

  getById: publicProcedure
    .input(idParamSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.db.findById<Volunteer>("volunteers", input.id);
    }),

  create: publicProcedure
    .input(createVolunteerSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.create<Volunteer>("volunteers", input);
    }),

  update: publicProcedure
    .input(updateVolunteerSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.update<Volunteer>("volunteers", id, data);
    }),

  delete: publicProcedure
    .input(idParamSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete("volunteers", input.id);
    }),
});
