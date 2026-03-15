import { router, createProtectedProcedure } from "../prod/trpc";
import { hubGrubLogSchema } from "shared/schemas/index";
import { z } from "zod";

export const hubGrubRouter = router({
  getAll: createProtectedProcedure("hubGrub", "read").query(async ({ ctx }) => {
    return await ctx.services.hubGrubLog.getAll(ctx.user);
  }),

  getById: createProtectedProcedure("hubGrub", "read")
    .input(hubGrubLogSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.hubGrubLog.getById(input.id, ctx.user);
    }),

  getByDateInterval: createProtectedProcedure("hubGrub", "read")
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.hubGrubLog.getByDateInterval(ctx.user, input);
    }),

  create: createProtectedProcedure("hubGrub", "create")
    .input(hubGrubLogSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.hubGrubLog.create(input, ctx.user);
    }),

  update: createProtectedProcedure("hubGrub", "update")
    .input(hubGrubLogSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.hubGrubLog.update(input, ctx.user);
    }),

  delete: createProtectedProcedure("hubGrub", "delete")
    .input(hubGrubLogSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.hubGrubLog.delete(ctx.user, input.id);
    }),
});
