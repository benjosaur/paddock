import { router, publicProcedure } from "../trpc.ts";
import {
  createClientRequestSchema,
  updateClientRequestSchema,
  idParamSchema,
  clientRequestSchema,
} from "shared/schemas/index.ts";
import type { ClientRequest } from "shared/types/index.ts";
import { keysToCamel } from "../../utils/caseConverter.ts";

export const clientRequestsRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.findAll<ClientRequest>("client_requests");
  }),

  getById: publicProcedure
    .input(idParamSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.db.findById<ClientRequest>("client_requests", input.id);
    }),

  getByClientId: publicProcedure
    .input(clientRequestSchema.pick({ clientId: true }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query(
        "SELECT * FROM client_requests WHERE client_id = $1 ORDER BY start_date DESC",
        [input.clientId]
      );
      return keysToCamel(result.rows);
    }),

  getByStatus: publicProcedure
    .input(clientRequestSchema.pick({ status: true }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query(
        "SELECT * FROM client_requests WHERE status = $1 ORDER BY start_date DESC",
        [input.status]
      );
      return keysToCamel(result.rows);
    }),

  create: publicProcedure
    .input(createClientRequestSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.create<ClientRequest>("client_requests", input);
    }),

  update: publicProcedure
    .input(updateClientRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.update<ClientRequest>("client_requests", id, data);
    }),

  delete: publicProcedure
    .input(idParamSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete("client_requests", input.id);
    }),
});
