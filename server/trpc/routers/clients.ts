import { infoDetailsSchema, endPersonDetailsSchema } from "shared";
import { router, createProtectedProcedure } from "../prod/trpc";
import { clientFullSchema, clientMetadataSchema } from "shared/schemas/index";
import { z } from "zod";

export const clientsRouter = router({
  getAll: createProtectedProcedure("clients", "read").query(async ({ ctx }) => {
    return await ctx.services.client.getAll(ctx.user);
  }),

  getAllNotEnded: createProtectedProcedure("clients", "read").query(
    async ({ ctx }) => {
      return await ctx.services.client.getAllNotEnded(ctx.user);
    }
  ),

  getAllWithMagService: createProtectedProcedure("clients", "read").query(
    async ({ ctx }) => {
      return await ctx.services.client.getAllWithMagService(ctx.user);
    }
  ),

  getById: createProtectedProcedure("clients", "read")
    .input(clientFullSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.client.getById(input.id, ctx.user);
    }),

  end: createProtectedProcedure("clients", "update")
    .input(endPersonDetailsSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.client.end(ctx.user, input);
    }),

  create: createProtectedProcedure("clients", "create")
    .input(clientMetadataSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.client.create(input, ctx.user);
    }),

  createInfoEntry: createProtectedProcedure("clients", "create")
    .input(
      z.object({
        client: clientMetadataSchema,
        infoDetails: infoDetailsSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.client.createInfoEntry(
        input.client,
        input.infoDetails,
        ctx.user
      );
    }),

  update: createProtectedProcedure("clients", "update")
    .input(clientMetadataSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.client.update(input, ctx.user);
    }),

  delete: createProtectedProcedure("clients", "delete")
    .input(clientMetadataSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.client.delete(ctx.user, input.id);
    }),

  updateName: createProtectedProcedure("clients", "update")
    .input(z.object({ client: clientMetadataSchema, newName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.client.updateName(
        input.client,
        input.newName,
        ctx.user
      );
    }),
  updateCustomId: createProtectedProcedure("clients", "update")
    .input(z.object({ client: clientMetadataSchema, newCustomId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.client.updateCustomId(
        input.client,
        input.newCustomId,
        ctx.user
      );
    }),
  updatePostCode: createProtectedProcedure("clients", "update")
    .input(z.object({ client: clientMetadataSchema, newPostcode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.client.updatePostCode(
        input.client,
        input.newPostcode,
        ctx.user
      );
    }),
});
