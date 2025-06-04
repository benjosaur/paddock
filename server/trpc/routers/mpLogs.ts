import { router, publicProcedure } from "../trpc.ts";
import {
  createMpLogSchema,
  updateMpLogSchema,
  idParamSchema,
  mpLogSchema,
} from "shared/schemas/index.ts";
import type { MpLog } from "shared/types/index.ts";
import { keysToCamel } from "../../utils/caseConverter.ts";

export const mpLogsRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.findAll<MpLog>("mp_logs");
  }),

  getById: publicProcedure
    .input(idParamSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.db.findById<MpLog>("mp_logs", input.id);
    }),

  getByMpId: publicProcedure
    .input(mpLogSchema.pick({ mpId: true }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query(
        "SELECT * FROM mp_logs WHERE mp_id = $1 ORDER BY date DESC",
        [input.mpId]
      );
      return keysToCamel(result.rows);
    }),

  getByClientId: publicProcedure
    .input(mpLogSchema.pick({ clientId: true }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query(
        "SELECT * FROM mp_logs WHERE client_id = $1 ORDER BY date DESC",
        [input.clientId]
      );
      return keysToCamel(result.rows);
    }),

  create: publicProcedure
    .input(createMpLogSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.create<MpLog>("mp_logs", input);
    }),

  update: publicProcedure
    .input(updateMpLogSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.update<MpLog>("mp_logs", id, data);
    }),

  delete: publicProcedure
    .input(idParamSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete("mp_logs", input.id);
    }),
});
