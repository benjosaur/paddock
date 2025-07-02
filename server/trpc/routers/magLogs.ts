import { router, createProtectedProcedure } from "../trpc.ts";
import { magLogSchema } from "shared/schemas/index.ts";

export const magLogsRouter = router({
  getAll: createProtectedProcedure("magLogs", "read").query(async ({ ctx }) => {
    return await ctx.services.magLog.getAll();
  }),

  getById: createProtectedProcedure("magLogs", "read")
    .input(magLogSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.magLog.getById(input.id);
    }),

  create: createProtectedProcedure("magLogs", "create")
    .input(magLogSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.magLog.create(input, ctx.user.sub);
    }),

  update: createProtectedProcedure("magLogs", "update")
    .input(magLogSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.magLog.update(input, ctx.user.sub);
    }),

  delete: createProtectedProcedure("magLogs", "delete")
    .input(magLogSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.magLog.delete(input.id);
    }),
});
