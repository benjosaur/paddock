import { router, createProtectedProcedure } from "../trpc.ts";
import {
  createVolunteerSchema,
  updateVolunteerSchema,
  idParamSchema,
} from "shared/schemas/index.ts";
import type { Volunteer } from "shared/types/index.ts";

export const volunteersRouter = router({
  getAll: createProtectedProcedure("volunteers", "read").query(
    async ({ ctx }) => {
      return await ctx.db.findAll<Volunteer>("volunteers");
    }
  ),

  getById: createProtectedProcedure("volunteers", "read")
    .input(idParamSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.db.findById<Volunteer>("volunteers", input.id);
    }),

  create: createProtectedProcedure("volunteers", "create")
    .input(createVolunteerSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.create<Volunteer>("volunteers", input);
    }),

  update: createProtectedProcedure("volunteers", "update")
    .input(updateVolunteerSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.update<Volunteer>("volunteers", id, data);
    }),

  delete: createProtectedProcedure("volunteers", "delete")
    .input(idParamSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete("volunteers", input.id);
    }),
});
