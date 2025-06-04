import { router, publicProcedure } from "../trpc.ts";
import {
  createMpLogSchema,
  updateMpLogSchema,
  idParamSchema,
  mpLogSchema,
} from "shared/schemas/index.ts";
import type { MpLog } from "shared/types/index.ts";

export const mpLogsRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.findAll<MpLog>("mpLogs");
  }),

  getById: publicProcedure
    .input(idParamSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.db.findById<MpLog>("mpLogs", input.id);
    }),

  getByMpId: publicProcedure
    .input(mpLogSchema.pick({ mpId: true }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query(
        "SELECT * FROM mpLogs WHERE mpId = $1 ORDER BY date DESC",
        [input.mpId]
      );
      return result.rows;
    }),

  getByClientId: publicProcedure
    .input(mpLogSchema.pick({ clientId: true }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query(
        "SELECT * FROM mpLogs WHERE clientId = $1 ORDER BY date DESC",
        [input.clientId]
      );
      return result.rows;
    }),

  create: publicProcedure
    .input(createMpLogSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.create<MpLog>("mpLogs", input);
    }),

  update: publicProcedure
    .input(updateMpLogSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.update<MpLog>("mpLogs", id, data);
    }),

  delete: publicProcedure
    .input(idParamSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete("mpLogs", input.id);
    }),
});
