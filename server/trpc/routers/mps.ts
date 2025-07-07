import { router, createProtectedProcedure } from "../trpc";
import { mpFullSchema } from "shared/schemas/index";

export const mpsRouter = router({
  getAll: createProtectedProcedure("mps", "read").query(async ({ ctx }) => {
    return await ctx.services.mp.getAll();
  }),

  getById: createProtectedProcedure("mps", "read")
    .input(mpFullSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.mp.getById(input.id);
    }),

  create: createProtectedProcedure("mps", "create")
    .input(mpFullSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.mp.create(input, ctx.user.sub);
    }),

  update: createProtectedProcedure("mps", "update")
    .input(mpFullSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.mp.update(input, ctx.user.sub);
    }),

  delete: createProtectedProcedure("mps", "delete")
    .input(mpFullSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.mp.delete(input.id);
    }),
});
