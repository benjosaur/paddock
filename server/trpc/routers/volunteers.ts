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

  getAllNotArchived: createProtectedProcedure("volunteers", "read").query(
    async ({ ctx }) => {
      return await ctx.services.volunteer.getAllNotArchived(ctx.user);
    }
  ),

  getById: createProtectedProcedure("volunteers", "read")
    .input(volunteerFullSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.volunteer.getById(input.id, ctx.user);
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

  delete: createProtectedProcedure("volunteers", "delete")
    .input(volunteerFullSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.volunteer.delete(ctx.user, input.id);
    }),

  toggleArchive: createProtectedProcedure("volunteers", "update")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.volunteer.toggleArchive(input.id, ctx.user);
    }),

  end: createProtectedProcedure("volunteers", "update")
    .input(endPersonDetailsSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.volunteer.end(ctx.user, input);
    }),
});
