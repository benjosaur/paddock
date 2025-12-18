import { z } from "zod";
import { router, createProtectedProcedure } from "../prod/trpc";
import { requestMetadataSchema } from "shared/schemas/index";
import { endRequestDetailsSchema } from "shared";
export const requestsRouter = router({
  getAllWithoutInfoWithPackages: createProtectedProcedure(
    "requests",
    "read"
  ).query(
    // not w/ associated packages
    async ({ ctx }) => {
      return await ctx.services.requests.getAllWithoutInfoWithPackages(
        ctx.user
      );
    }
  ),

  getAllWithoutInfoNotEndedYetWithPackages: createProtectedProcedure(
    "requests",
    "read"
  ).query(async ({ ctx }) => {
    return await ctx.services.requests.getAllWithoutInfoNotEndedYetWithPackages(
      ctx.user
    );
  }),

  getAllInfoMetadata: createProtectedProcedure("requests", "read").query(
    async ({ ctx }) => {
      return await ctx.services.requests.getAllInfoMetadata(ctx.user);
    }
  ),

  getAllMetadataWithoutInfo: createProtectedProcedure("requests", "read").query(
    async ({ ctx }) => {
      return await ctx.services.requests.getAllMetadataWithoutInfo(ctx.user);
    }
  ),

  getAllMetadataWithoutInfoNotEndedYet: createProtectedProcedure(
    "requests",
    "read"
  ).query(async ({ ctx }) => {
    return await ctx.services.requests.getAllMetadataWithoutInfoNotEndedYet(
      ctx.user
    );
  }),

  getById: createProtectedProcedure("requests", "read")
    .input(requestMetadataSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.requests.getById(input.id, ctx.user);
    }),
  getRequestWithOnePackageByPackageId: createProtectedProcedure(
    "requests",
    "read"
  )
    .input(z.object({ packageId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.requests.getRequestWithOnePackageByPackageId(
        input.packageId,
        ctx.user
      );
    }),
  create: createProtectedProcedure("requests", "create")
    .input(requestMetadataSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.requests.create(input, ctx.user);
    }),
  update: createProtectedProcedure("requests", "update")
    .input(requestMetadataSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.requests.update(input, ctx.user);
    }),
  renew: createProtectedProcedure("requests", "update")
    .input(
      z.object({
        oldRequest: requestMetadataSchema,
        newRequest: requestMetadataSchema.omit({ id: true }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.requests.renew(
        input.oldRequest,
        input.newRequest,
        ctx.user
      );
    }),
  endRequestAndPackages: createProtectedProcedure("requests", "update")
    .input(endRequestDetailsSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.requests.endRequestAndPackages(ctx.user, input);
    }),
  delete: createProtectedProcedure("requests", "delete")
    .input(requestMetadataSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.requests.delete(ctx.user, input.id);
    }),
});
