import { router, createProtectedProcedure } from "../trpc.ts";
import { volunteerFullSchema } from "shared/schemas/index.ts";

export const volunteersRouter = router({
  getAll: createProtectedProcedure("volunteers", "read").query(
    async ({ ctx }) => {
      return await ctx.services.volunteer.getAll();
    }
  ),

  getById: createProtectedProcedure("volunteers", "read")
    .input(volunteerFullSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.volunteer.getById(input.id);
    }),

  create: createProtectedProcedure("volunteers", "create")
    .input(volunteerFullSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.volunteer.create(input, ctx.user.sub);
    }),

  update: createProtectedProcedure("volunteers", "update")
    .input(volunteerFullSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.volunteer.update(input, ctx.user.sub);
    }),

  delete: createProtectedProcedure("volunteers", "delete")
    .input(volunteerFullSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.volunteer.delete(input.id);
    }),
});
