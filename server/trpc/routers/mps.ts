import { router, createProtectedProcedure } from "../trpc.ts";
import {
  createMpSchema,
  updateMpSchema,
  idParamSchema,
} from "shared/schemas/index.ts";
import type { Mp } from "shared/types/index.ts";

export const mpsRouter = router({
  getAll: createProtectedProcedure("mps", "read").query(async ({ ctx }) => {
    return await ctx.db.findAll<Mp>("mps");
  }),

  getById: createProtectedProcedure("mps", "read")
    .input(idParamSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.db.findById<Mp>("mps", input.id);
    }),

  create: createProtectedProcedure("mps", "create")
    .input(createMpSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.create<Mp>("mps", input);
    }),

  update: createProtectedProcedure("mps", "update")
    .input(updateMpSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.update<Mp>("mps", id, data);
    }),

  delete: createProtectedProcedure("mps", "delete")
    .input(idParamSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete("mps", input.id);
    }),
});
