import { router, createProtectedProcedure } from "../prod/trpc";
import { trainingRecordSchema } from "shared/schemas/index";

export const trainingRecordsRouter = router({
  getAll: createProtectedProcedure("trainingRecords", "read").query(
    async ({ ctx }) => {
      return await ctx.services.training.getAll(ctx.user);
    }
  ),

  getAllNotEnded: createProtectedProcedure("trainingRecords", "read").query(
    async ({ ctx }) => {
      return await ctx.services.training.getAllNotEnded(ctx.user);
    }
  ),

  getByExpiringBefore: createProtectedProcedure("trainingRecords", "read")
    .input(trainingRecordSchema.pick({ expiryDate: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.training.getByExpiringBefore(
        ctx.user,
        input.expiryDate
      );
    }),

  getById: createProtectedProcedure("trainingRecords", "read")
    .input(trainingRecordSchema.pick({ id: true, ownerId: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.training.getById(
        ctx.user,
        input.ownerId,
        input.id
      );
    }),

  create: createProtectedProcedure("trainingRecords", "create")
    .input(trainingRecordSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.training.create(input, ctx.user);
    }),

  update: createProtectedProcedure("trainingRecords", "update")
    .input(trainingRecordSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.training.update(input, ctx.user);
    }),

  delete: createProtectedProcedure("trainingRecords", "delete")
    .input(trainingRecordSchema.pick({ id: true, ownerId: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.training.delete(
        ctx.user,
        input.ownerId,
        input.id
      );
    }),
});
