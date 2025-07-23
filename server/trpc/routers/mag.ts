import { router, createProtectedProcedure } from "../prod/trpc";
import { magLogSchema } from "shared/schemas/index";

export const magRouter = router({
  getAll: createProtectedProcedure("mag", "read").query(async ({ ctx }) => {
    return await ctx.services.magLog.getAll(ctx.user);
  }),

  getById: createProtectedProcedure("mag", "read")
    .input(magLogSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.magLog.getById(input.id, ctx.user);
    }),

  create: createProtectedProcedure("mag", "create")
    .input(magLogSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.magLog.create(input, ctx.user);
    }),

  update: createProtectedProcedure("mag", "update")
    .input(magLogSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.magLog.update(input, ctx.user);
    }),

  delete: createProtectedProcedure("mag", "delete")
    .input(magLogSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.magLog.delete(ctx.user, input.id);
    }),
});
