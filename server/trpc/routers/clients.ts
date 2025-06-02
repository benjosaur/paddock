import { z } from "zod";
import { router, publicProcedure } from "../trpc.ts";
import {
  createClientSchema,
  updateClientSchema,
  idParamSchema,
} from "shared/schemas/index.ts";
import type { Client } from "shared/types/index.ts";

export const clientsRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.findAll<Client>("clients");
  }),

  getById: publicProcedure
    .input(idParamSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.db.findById<Client>("clients", input.id);
    }),

  create: publicProcedure
    .input(createClientSchema)
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      return await ctx.db.create<Client>("clients", { id, ...input });
    }),

  update: publicProcedure
    .input(updateClientSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.update<Client>("clients", id, data);
    }),

  delete: publicProcedure
    .input(idParamSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete("clients", input.id);
    }),
});
