import { router, createProtectedProcedure } from "../trpc";
import { clientRequestSchema } from "shared/schemas/index";

export const clientRequestsRouter = router({
  getAll: createProtectedProcedure("clientRequests", "read").query(
    async ({ ctx }) => {
      return await ctx.services.requests.getAll();
    }
  ),

  getById: createProtectedProcedure("clientRequests", "read")
    .input(clientRequestSchema.pick({ id: true, clientId: true }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.requests.getById(
        input.clientId,
        input.id
      );
      return result;
    }),

  getByClientId: createProtectedProcedure("clientRequests", "read")
    .input(clientRequestSchema.pick({ clientId: true }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.requests.getByClientId(input.clientId);
      return result;
    }),

  create: createProtectedProcedure("clientRequests", "create")
    .input(clientRequestSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.requests.create(input, ctx.user.sub);
    }),

  update: createProtectedProcedure("clientRequests", "update")
    .input(clientRequestSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.requests.update(input, ctx.user.sub);
    }),

  delete: createProtectedProcedure("clientRequests", "delete")
    .input(clientRequestSchema.pick({ clientId: true, id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.requests.delete(input.clientId, input.id);
    }),
});
