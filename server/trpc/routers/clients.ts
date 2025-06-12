import { router, createProtectedProcedure } from "../trpc.ts";
import {
  createClientSchema,
  updateClientSchema,
  idParamSchema,
} from "shared/schemas/index.ts";
import type { Client } from "shared/types/index.ts";

export const clientsRouter = router({
  getAll: createProtectedProcedure('clients', 'read').query(async ({ ctx }) => {
    return await ctx.db.findAll<Client>("clients");
  }),

  getById: createProtectedProcedure('clients', 'read')
    .input(idParamSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.db.findById<Client>("clients", input.id);
    }),

  create: createProtectedProcedure('clients', 'create')
    .input(createClientSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.create<Client>("clients", input);
    }),

  update: createProtectedProcedure('clients', 'update')
    .input(updateClientSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.update<Client>("clients", id, data);
    }),

  delete: createProtectedProcedure('clients', 'delete')
    .input(idParamSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete("clients", input.id);
    }),
});
