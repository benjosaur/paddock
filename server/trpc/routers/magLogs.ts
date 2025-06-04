import { router, publicProcedure } from "../trpc.ts";
import {
  createMagLogSchema,
  updateMagLogSchema,
  idParamSchema,
} from "shared/schemas/index.ts";
import type { MagLog } from "shared/types/index.ts";

export const magLogsRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.findAll<MagLog>("mag_logs");
  }),

  getById: publicProcedure
    .input(idParamSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.db.findById<MagLog>("mag_logs", input.id);
    }),

  create: publicProcedure
    .input(createMagLogSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.create<MagLog>("mag_logs", input);
    }),

  update: publicProcedure
    .input(updateMagLogSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.update<MagLog>("mag_logs", id, data);
    }),

  delete: publicProcedure
    .input(idParamSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete("mag_logs", input.id);
    }),
});
