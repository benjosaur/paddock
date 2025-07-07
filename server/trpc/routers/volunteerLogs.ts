import { router, createProtectedProcedure } from "../trpc";
import { volunteerLogSchema } from "shared/schemas/index";

export const volunteerLogsRouter = router({
  getAll: createProtectedProcedure("volunteerLogs", "read").query(
    async ({ ctx }) => {
      return await ctx.services.volunteerLog.getAll();
    }
  ),

  getById: createProtectedProcedure("volunteerLogs", "read")
    .input(volunteerLogSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.volunteerLog.getById(input.id);
    }),

  getByVolunteerId: createProtectedProcedure("volunteerLogs", "read")
    .input(volunteerLogSchema.shape.volunteers.element.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.volunteerLog.getByVolunteerId(input.id);
    }),

  create: createProtectedProcedure("volunteerLogs", "create")
    .input(volunteerLogSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.volunteerLog.create(input, ctx.user.sub);
    }),

  update: createProtectedProcedure("volunteerLogs", "update")
    .input(volunteerLogSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.volunteerLog.update(input, ctx.user.sub);
    }),

  delete: createProtectedProcedure("volunteerLogs", "delete")
    .input(volunteerLogSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.volunteerLog.delete(input.id);
    }),
});
