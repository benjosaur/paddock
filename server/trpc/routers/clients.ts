import { router, createProtectedProcedure } from "../prod/trpc";
import { clientFullSchema } from "shared/schemas/index";
import { z } from "zod";

export const clientsRouter = router({
  getAll: createProtectedProcedure("clients", "read").query(async ({ ctx }) => {
    return await ctx.services.client.getAll(ctx.user);
  }),

  getAllNotArchived: createProtectedProcedure("clients", "read").query(
    async ({ ctx }) => {
      return await ctx.services.client.getAllNotArchived(ctx.user);
    }
  ),

  getById: createProtectedProcedure("clients", "read")
    .input(clientFullSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.client.getById(input.id, ctx.user);
    }),

  create: createProtectedProcedure("clients", "create")
    .input(clientFullSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.client.create(input, ctx.user);
    }),

  update: createProtectedProcedure("clients", "update")
    .input(clientFullSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.client.update(input, ctx.user);
    }),

  delete: createProtectedProcedure("clients", "delete")
    .input(clientFullSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.client.delete(ctx.user, input.id);
    }),

  updateName: createProtectedProcedure("clients", "update")
    .input(z.object({ clientId: z.string(), newName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.client.updateName(
        input.clientId,
        input.newName,
        ctx.user
      );
    }),

  updatePostCode: createProtectedProcedure("clients", "update")
    .input(z.object({ clientId: z.string(), newPostCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.client.updatePostCode(
        input.clientId,
        input.newPostCode,
        ctx.user
      );
    }),
});
