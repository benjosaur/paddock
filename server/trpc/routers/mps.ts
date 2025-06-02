import { z } from "zod";
import { router, publicProcedure } from "../trpc.ts";
import {
  createMpSchema,
  updateMpSchema,
  idParamSchema,
} from "shared/schemas/index.ts";
import type { Mp } from "shared/types/index.ts";

export const mpsRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.findAll<Mp>("mps");
  }),

  getById: publicProcedure
    .input(idParamSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.db.findById<Mp>("mps", input.id);
    }),

  create: publicProcedure
    .input(createMpSchema)
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      return await ctx.db.create<Mp>("mps", { id, ...input });
    }),

  update: publicProcedure
    .input(updateMpSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.update<Mp>("mps", id, data);
    }),

  delete: publicProcedure
    .input(idParamSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete("mps", input.id);
    }),
});
