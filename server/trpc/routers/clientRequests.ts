import { router, createProtectedProcedure } from "../prod/trpc";
import { clientRequestSchema } from "shared/schemas/index";

export const clientRequestsRouter = router({
  getAll: createProtectedProcedure("clientRequests", "read").query(
    async ({ ctx }) => {
      return await ctx.services.requests.getAll(ctx.user);
    }
  ),

  getById: createProtectedProcedure("clientRequests", "read")
    .input(clientRequestSchema.pick({ id: true, clientId: true }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.requests.getById(
        ctx.user,
        input.clientId,
        input.id
      );
      return result;
    }),

  getByClientId: createProtectedProcedure("clientRequests", "read")
    .input(clientRequestSchema.pick({ clientId: true }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.requests.getByClientId(
        ctx.user,
        input.clientId
      );
      return result;
    }),

  create: createProtectedProcedure("clientRequests", "create")
    .input(clientRequestSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.requests.create(input, ctx.user);
    }),

  update: createProtectedProcedure("clientRequests", "update")
    .input(clientRequestSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.requests.update(input, ctx.user);
    }),

  delete: createProtectedProcedure("clientRequests", "delete")
    .input(clientRequestSchema.pick({ clientId: true, id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.requests.delete(
        ctx.user,
        input.clientId,
        input.id
      );
    }),
});
