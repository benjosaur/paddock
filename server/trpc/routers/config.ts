import { router, createProtectedProcedure } from "../prod/trpc";
import { optionListSchema, tableColumnConfigSchema } from "shared/schemas/index";

export const configRouter = router({
  get: createProtectedProcedure("config", "read").query(async ({ ctx }) => {
    return await ctx.services.config.get(ctx.user);
  }),

  updateServices: createProtectedProcedure("config", "update")
    .input(optionListSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.config.updateServices(ctx.user, input);
    }),

  updateLocalities: createProtectedProcedure("config", "update")
    .input(optionListSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.config.updateLocalities(ctx.user, input);
    }),

  updateTrainingRecordTypes: createProtectedProcedure("config", "update")
    .input(optionListSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.config.updateTrainingRecordTypes(
        ctx.user,
        input
      );
    }),

  updateTableColumns: createProtectedProcedure("config", "update")
    .input(tableColumnConfigSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.config.updateTableColumns(ctx.user, input);
    }),
});
