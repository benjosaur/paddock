import { router, createProtectedProcedure } from "../trpc";
import { magLogSchema } from "shared/schemas/index";

export const magLogsRouter = router({
  getAll: createProtectedProcedure("magLogs", "read").query(async ({ ctx }) => {
    return await ctx.services.magLog.getAll(ctx.user);
  }),

  getById: createProtectedProcedure("magLogs", "read")
    .input(magLogSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.magLog.getById(ctx.user, input.id);
    }),

  create: createProtectedProcedure("magLogs", "create")
    .input(magLogSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.magLog.create(input, ctx.user);
    }),

  update: createProtectedProcedure("magLogs", "update")
    .input(magLogSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.magLog.update(input, ctx.user);
    }),

  delete: createProtectedProcedure("magLogs", "delete")
    .input(magLogSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.magLog.delete(ctx.user, input.id);
    }),
});
