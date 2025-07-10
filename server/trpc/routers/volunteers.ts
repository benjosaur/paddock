import { z } from "zod";
import { router, createProtectedProcedure } from "../prod/trpc";
import { volunteerFullSchema } from "shared/schemas/index";

export const volunteersRouter = router({
  getAll: createProtectedProcedure("volunteers", "read").query(
    async ({ ctx }) => {
      return await ctx.services.volunteer.getAll(ctx.user);
    }
  ),

  getById: createProtectedProcedure("volunteers", "read")
    .input(volunteerFullSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.volunteer.getById(ctx.user, input.id);
    }),

  create: createProtectedProcedure("volunteers", "create")
    .input(volunteerFullSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.volunteer.create(input, ctx.user);
    }),

  update: createProtectedProcedure("volunteers", "update")
    .input(volunteerFullSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.volunteer.update(input, ctx.user);
    }),

  updateName: createProtectedProcedure("volunteers", "update")
    .input(z.object({ volunteerId: z.string(), newName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.volunteer.updateName(
        input.volunteerId,
        input.newName,
        ctx.user
      );
    }),

  delete: createProtectedProcedure("volunteers", "delete")
    .input(volunteerFullSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.volunteer.delete(ctx.user, input.id);
    }),
});
