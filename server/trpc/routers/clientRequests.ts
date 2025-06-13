import { router, createProtectedProcedure } from "../trpc.ts";
import {
  createClientRequestSchema,
  updateClientRequestSchema,
  idParamSchema,
  clientRequestSchema,
} from "shared/schemas/index.ts";
import type { ClientRequest } from "shared/types/index.ts";
import { keysToCamel } from "../../utils/caseConverter.ts";

export const clientRequestsRouter = router({
  getAll: createProtectedProcedure("clientRequests", "read").query(
    async ({ ctx }) => {
      return await ctx.db.findAll<ClientRequest>("client_requests");
    }
  ),

  getById: createProtectedProcedure("clientRequests", "read")
    .input(idParamSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.db.findById<ClientRequest>("client_requests", input.id);
    }),

  getByClientId: createProtectedProcedure("clientRequests", "read")
    .input(clientRequestSchema.pick({ clientId: true }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query(
        "SELECT * FROM client_requests WHERE client_id = $1 ORDER BY start_date DESC",
        [input.clientId]
      );
      return keysToCamel(result.rows);
    }),

  getByStatus: createProtectedProcedure("clientRequests", "read")
    .input(clientRequestSchema.pick({ status: true }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query(
        "SELECT * FROM client_requests WHERE status = $1 ORDER BY start_date DESC",
        [input.status]
      );
      return keysToCamel(result.rows);
    }),

  create: createProtectedProcedure("clientRequests", "create")
    .input(createClientRequestSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.create<ClientRequest>("client_requests", input);
    }),

  update: createProtectedProcedure("clientRequests", "update")
    .input(updateClientRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.update<ClientRequest>("client_requests", id, data);
    }),

  delete: createProtectedProcedure("clientRequests", "delete")
    .input(idParamSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete("client_requests", input.id);
    }),
});
