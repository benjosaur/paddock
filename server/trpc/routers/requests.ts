import { router, createProtectedProcedure } from "../prod/trpc";
import { requestMetadataSchema } from "shared/schemas/index";
export const requestsRouter = router({
  getAllMetadata: createProtectedProcedure("requests", "read").query(
    async ({ ctx }) => {
      return await ctx.services.requests.getAllMetadata(ctx.user);
    }
  ),

  getAllNotArchived: createProtectedProcedure("requests", "read").query(
    async ({ ctx }) => {
      return await ctx.services.requests.getAllNotArchivedWithPackages(
        ctx.user
      );
    }
  ),

  getAllNotEndedYet: createProtectedProcedure("requests", "read").query(
    async ({ ctx }) => {
      return await ctx.services.requests.getAllNotEndedYetWithPackages(
        ctx.user
      );
    }
  ),
  getById: createProtectedProcedure("requests", "read")
    .input(requestMetadataSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.requests.getById(input.id, ctx.user);
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
  delete: createProtectedProcedure("requests", "delete")
    .input(requestMetadataSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.requests.delete(ctx.user, input.id);
    }),
});
