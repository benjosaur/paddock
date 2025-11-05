import {
  crossSectionSchema,
  deprivationCrossSectionSchema,
  reportSchema,
  deprivationReportSchema,
  attendanceAllowanceCrossSectionSchema,
  analyticsDetailsSchema,
} from "shared";
import { router, createProtectedProcedure } from "../prod/trpc";
import { z } from "zod";

export const analyticsRouter = router({
  generateAttendanceAllowanceCrossSection: createProtectedProcedure(
    "analytics",
    "read"
  )
    .output(attendanceAllowanceCrossSectionSchema)
    .query(async ({ ctx }) => {
      return await ctx.services.analytics.generateAttendanceAllowanceCrossSection(
        ctx.user
      );
    }),

  generateAttendanceAllowanceReport: createProtectedProcedure(
    "analytics",
    "read"
  )
    .input(z.object({ startYear: z.number().optional() }))
    .output(reportSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.services.analytics.generateAttendanceAllowanceReport(
        ctx.user,
        input.startYear
      );
    }),

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
    .input(analyticsDetailsSchema)
    .output(reportSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.services.analytics.generateRequestsReport(
        ctx.user,
        input.isInfo,
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

  getCoordinatorReport: createProtectedProcedure("analytics", "read")
    .input(z.object({ startYear: z.number().optional() }))
    .output(reportSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.services.analytics.generateCoordinatorReport(
        ctx.user,
        input.startYear
      );
    }),

  getActiveRequestsDeprivationCrossSection: createProtectedProcedure(
    "analytics",
    "read"
  )
    .output(deprivationCrossSectionSchema)
    .query(async ({ ctx }) => {
      return await ctx.services.analytics.generateActiveRequestsDeprivationCrossSection(
        ctx.user
      );
    }),

  getActivePackagesDeprivationCrossSection: createProtectedProcedure(
    "analytics",
    "read"
  )
    .output(deprivationCrossSectionSchema)
    .query(async ({ ctx }) => {
      return await ctx.services.analytics.generateActivePackagesDeprivationCrossSection(
        ctx.user
      );
    }),

  getRequestsDeprivationReport: createProtectedProcedure("analytics", "read")
    .input(analyticsDetailsSchema)
    .output(deprivationReportSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.services.analytics.generateRequestsDeprivationReport(
        ctx.user,
        input.isInfo,
        input.startYear
      );
    }),

  getPackagesDeprivationReport: createProtectedProcedure("analytics", "read")
    .input(z.object({ startYear: z.number().optional() }))
    .output(deprivationReportSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.services.analytics.generatePackagesDeprivationReport(
        ctx.user,
        input.startYear
      );
    }),
});
