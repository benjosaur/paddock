import { router, createProtectedProcedure } from "../prod/trpc";
import { packageSchema } from "shared/schemas/index";
export const packagesRouter = router({
  getAll: createProtectedProcedure("packages", "read").query(
    async ({ ctx }) => {
      return await ctx.services.packages.getAll(ctx.user);
    }
  ),
  getAllNotEndedYet: createProtectedProcedure("packages", "read").query(
    async ({ ctx }) => {
      return await ctx.services.packages.getAllNotEndedYet(ctx.user);
    }
  ),
  getById: createProtectedProcedure("packages", "read")
    .input(packageSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.packages.getById(input.id, ctx.user);
    }),
  create: createProtectedProcedure("packages", "create")
    .input(packageSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.packages.create(input, ctx.user);
    }),
  update: createProtectedProcedure("packages", "update")
    .input(packageSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.packages.update(input, ctx.user);
    }),
  delete: createProtectedProcedure("packages", "delete")
    .input(packageSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.packages.delete(ctx.user, input.id);
    }),
});
