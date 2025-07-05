import { router, createProtectedProcedure } from "../trpc.ts";
import { clientFullSchema } from "shared/schemas/index.ts";

export const clientsRouter = router({
  getAll: createProtectedProcedure("clients", "read").query(async ({ ctx }) => {
    return await ctx.services.client.getAll();
  }),

  getById: createProtectedProcedure("clients", "read")
    .input(clientFullSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.client.getById(input.id);
    }),

  create: createProtectedProcedure("clients", "create")
    .input(clientFullSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.client.create(input, ctx.user.sub);
    }),

  update: createProtectedProcedure("clients", "update")
    .input(clientFullSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.client.update(input, ctx.user.sub);
    }),

  delete: createProtectedProcedure("clients", "delete")
    .input(clientFullSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.client.delete(input.id);
    }),

  updateName: createProtectedProcedure("clients", "update")
    .input(clientFullSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.client.updateName(input, ctx.user.sub);
    }),

  updatePostCode: createProtectedProcedure("clients", "update")
    .input(clientFullSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.client.updatePostCode(input, ctx.user.sub);
    }),
});
