import { z } from "zod";
import { router, publicProcedure } from "../trpc.ts";
import {
  createClientRequestSchema,
  updateClientRequestSchema,
  idParamSchema,
  clientRequestSchema,
} from "shared/schemas/index.ts";
import type { ClientRequest } from "shared/types/index.ts";

export const clientRequestsRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.findAll<ClientRequest>("clientRequests");
  }),

  getById: publicProcedure
    .input(idParamSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.db.findById<ClientRequest>("clientRequests", input.id);
    }),

  getByClientId: publicProcedure
    .input(clientRequestSchema.pick({ clientId: true }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query(
        "SELECT * FROM clientRequests WHERE clientId = $1 ORDER BY start_date DESC",
        [input.clientId]
      );
      return result.rows;
    }),

  getByStatus: publicProcedure
    .input(clientRequestSchema.pick({ status: true }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query(
        "SELECT * FROM clientRequests WHERE status = $1 ORDER BY start_date DESC",
        [input.status]
      );
      return result.rows;
    }),

  create: publicProcedure
    .input(createClientRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      return await ctx.db.create<ClientRequest>("clientRequests", {
        id,
        ...input,
      });
    }),

  update: publicProcedure
    .input(updateClientRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.update<ClientRequest>("clientRequests", id, data);
    }),

  delete: publicProcedure
    .input(idParamSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete("clientRequests", input.id);
    }),
});
