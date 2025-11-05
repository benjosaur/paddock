import { z } from "zod";
import { router, createProtectedProcedure } from "../prod/trpc";
import {
  volunteerFullSchema,
  volunteerMetadataSchema,
} from "shared/schemas/index";
import { endPersonDetailsSchema } from "shared";

export const volunteersRouter = router({
  getAll: createProtectedProcedure("volunteers", "read").query(
    async ({ ctx }) => {
      return await ctx.services.volunteer.getAll(ctx.user);
    }
  ),

  getAllNotEnded: createProtectedProcedure("volunteers", "read").query(
    async ({ ctx }) => {
      return await ctx.services.volunteer.getAllNotEnded(ctx.user);
    }
  ),

  getById: createProtectedProcedure("volunteers", "read")
    .input(volunteerFullSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.volunteer.getById(input.id, ctx.user);
    }),

  getCoreTrainingRecordCompletions: createProtectedProcedure(
    "volunteers",
    "read"
  )
    .input(z.object({ withEnded: z.boolean().default(false) }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.volunteer.getCoreTrainingRecordCompletions(
        input.withEnded,
        ctx.user
      );
    }),

  create: createProtectedProcedure("volunteers", "create")
    .input(volunteerMetadataSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.volunteer.create(input, ctx.user);
    }),

  update: createProtectedProcedure("volunteers", "update")
    .input(volunteerMetadataSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.volunteer.update(input, ctx.user);
    }),

  updateName: createProtectedProcedure("volunteers", "update")
    .input(z.object({ volunteerId: z.string(), newName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.volunteer.updateName(
        input.volunteerId,
        input.newName,
        ctx.user
      );
    }),

  getAllPackagesByCoordinator: createProtectedProcedure(
    "volunteers",
    "read"
  ).query(async ({ ctx }) => {
    return await ctx.services.volunteer.getAllPackagesByCoordinator(ctx.user);
  }),

  delete: createProtectedProcedure("volunteers", "delete")
    .input(volunteerFullSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.volunteer.delete(ctx.user, input.id);
    }),

  end: createProtectedProcedure("volunteers", "update")
    .input(endPersonDetailsSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.volunteer.end(ctx.user, input);
    }),
});
