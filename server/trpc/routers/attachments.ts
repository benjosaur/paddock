import { z } from "zod";
import { allowedAttachmentTypes, maxAttachmentBytes } from "shared/const";
import { router, createProtectedProcedure } from "../prod/trpc";

// Attachments piggyback on the owning entity's permissions (clients only for
// now): viewing needs clients read, changing needs clients update — the same
// gate as editing any other client data.
const ownerIdSchema = z.string().startsWith("c#");
const attachmentIdSchema = z.string().startsWith("att#");

export const attachmentsRouter = router({
  listByOwner: createProtectedProcedure("clients", "read")
    .input(z.object({ ownerId: ownerIdSchema }))
    .query(async ({ ctx, input }) => {
      return await ctx.services.attachment.listByOwner(input.ownerId, ctx.user);
    }),

  createUploadUrl: createProtectedProcedure("clients", "update")
    .input(
      z.object({
        ownerId: ownerIdSchema,
        contentType: z.enum(allowedAttachmentTypes),
        size: z.number().int().positive().max(maxAttachmentBytes),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.attachment.createUploadUrl(input, ctx.user);
    }),

  confirm: createProtectedProcedure("clients", "update")
    .input(
      z.object({
        ownerId: ownerIdSchema,
        attachmentId: attachmentIdSchema,
        fileName: z.string().min(1).max(255),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.attachment.confirm(input, ctx.user);
    }),

  delete: createProtectedProcedure("clients", "update")
    .input(
      z.object({ ownerId: ownerIdSchema, attachmentId: attachmentIdSchema })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.attachment.delete(
        input.ownerId,
        input.attachmentId,
        ctx.user
      );
    }),
});
