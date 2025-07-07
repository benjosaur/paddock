import { router, createProtectedProcedure } from "../trpc.ts";
import { mpLogSchema } from "shared/schemas/index.ts";

export const mpLogsRouter = router({
  getAll: createProtectedProcedure("mpLogs", "read").query(async ({ ctx }) => {
    return await ctx.services.mpLog.getAll();
  }),

  getById: createProtectedProcedure("mpLogs", "read")
    .input(mpLogSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.mpLog.getById(input.id);
    }),

  getByMpId: createProtectedProcedure("mpLogs", "read")
    .input(mpLogSchema.pick({ mps: true }))
    .query(async ({ ctx, input }) => {
      // Assuming the first MP in the array is the one we want logs for
      return await ctx.services.mpLog.getByMpId(input.mps[0].id);
    }),

  getByClientId: createProtectedProcedure("mpLogs", "read")
    .input(mpLogSchema.pick({ clients: true }))
    .query(async ({ ctx, input }) => {
      // Getting logs for the first client in the array
      const clientId = input.clients[0].id;
      const allLogs = await ctx.services.mpLog.getAll();
      return allLogs.filter((log) =>
        log.clients.some((client) => client.id === clientId)
      );
    }),

  create: createProtectedProcedure("mpLogs", "create")
    .input(mpLogSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.mpLog.create(input, ctx.user.sub);
    }),

  update: createProtectedProcedure("mpLogs", "update")
    .input(mpLogSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.mpLog.update(input, ctx.user.sub);
    }),

  delete: createProtectedProcedure("mpLogs", "delete")
    .input(mpLogSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.mpLog.delete(input.id);
    }),
});
