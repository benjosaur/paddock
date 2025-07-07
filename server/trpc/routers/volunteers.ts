import { router, createProtectedProcedure } from "../trpc";
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

  delete: createProtectedProcedure("volunteers", "delete")
    .input(volunteerFullSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.volunteer.delete(ctx.user, input.id);
    }),
});
