import { crossSectionSchema, reportSchema } from "shared";
import { router, createProtectedProcedure } from "../prod/trpc";
import { z } from "zod";

export const analyticsRouter = router({
  getActiveRequestsCrossSection: createProtectedProcedure("analytics", "read")
    .output(crossSectionSchema)
    .query(async ({ ctx }) => {
      return await ctx.services.analytics.generateActiveRequestsCrossSection(
        ctx.user
      );
    }),

  getActivePackagesCrossSection: createProtectedProcedure("analytics", "read")
    .output(crossSectionSchema)
    .query(async ({ ctx }) => {
      return await ctx.services.analytics.generateActivePackagesCrossSection(
        ctx.user
      );
    }),

  getRequestsReport: createProtectedProcedure("analytics", "read")
    .input(z.object({ startYear: z.number().optional() }))
    .output(reportSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.services.analytics.generateRequestsReport(
        ctx.user,
        input.startYear
      );
    }),

  getPackagesReport: createProtectedProcedure("analytics", "read")
    .input(z.object({ startYear: z.number().optional() }))
    .output(reportSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.services.analytics.generatePackagesReport(
        ctx.user,
        input.startYear
      );
    }),
});
