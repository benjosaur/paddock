import { z } from "zod";
import { router, createProtectedProcedure } from "../prod/trpc";
import { mpFullSchema, mpMetadataSchema } from "shared/schemas/index";
import { getAllJSDocTagsOfKind } from "typescript";

export const mpsRouter = router({
  getAll: createProtectedProcedure("mps", "read").query(async ({ ctx }) => {
    return await ctx.services.mp.getAll(ctx.user);
  }),

  getAllNotArchived: createProtectedProcedure("mps", "read").query(
    async ({ ctx }) => {
      return await ctx.services.mp.getAllNotArchived(ctx.user);
    }
  ),

  getById: createProtectedProcedure("mps", "read")
    .input(mpFullSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.mp.getById(input.id, ctx.user);
    }),

  create: createProtectedProcedure("mps", "create")
    .input(mpMetadataSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.mp.create(input, ctx.user);
    }),

  update: createProtectedProcedure("mps", "update")
    .input(mpMetadataSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.mp.update(input, ctx.user);
    }),

  updateName: createProtectedProcedure("mps", "update")
    .input(z.object({ mpId: z.string(), newName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.mp.updateName(
        input.mpId,
        input.newName,
        ctx.user
      );
    }),

  delete: createProtectedProcedure("mps", "delete")
    .input(mpFullSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.mp.delete(ctx.user, input.id);
    }),
});
