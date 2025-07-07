import { router, createProtectedProcedure } from "../trpc";
import { trainingRecordSchema } from "shared/schemas/index";

export const trainingRecordsRouter = router({
  getAll: createProtectedProcedure("trainingRecords", "read").query(
    async ({ ctx }) => {
      return await ctx.services.training.getAll();
    }
  ),

  getByExpiringBefore: createProtectedProcedure("trainingRecords", "read")
    .input(trainingRecordSchema.pick({ recordExpiry: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.training.getByExpiringBefore(
        input.recordExpiry
      );
    }),

  getById: createProtectedProcedure("trainingRecords", "read")
    .input(trainingRecordSchema.pick({ id: true, ownerId: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.training.getById(input.ownerId, input.id);
    }),

  create: createProtectedProcedure("trainingRecords", "create")
    .input(trainingRecordSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.training.create(input, ctx.user.sub);
    }),

  update: createProtectedProcedure("trainingRecords", "update")
    .input(trainingRecordSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.training.update(input, ctx.user.sub);
    }),

  delete: createProtectedProcedure("trainingRecords", "delete")
    .input(trainingRecordSchema.pick({ id: true, ownerId: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.training.delete(input.ownerId, input.id);
    }),
});
