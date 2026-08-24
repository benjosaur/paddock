import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { allowedAttachmentTypes, maxAttachmentBytes } from "shared/const";
import { rolePermissions } from "shared/permissions";
import { router, protectedProcedure } from "../prod/trpc";

// Attachments piggyback on the owning entity's permissions: viewing needs the
// owner resource's read, changing needs its update — the same gates as any
// other data on that entity. The resource depends on the ownerId prefix, so
// the check happens per-request instead of via createProtectedProcedure.
const ownerResources = {
  "c#": "clients",
  "mp#": "mps",
  "v#": "volunteers",
} as const;

const ownerIdSchema = z
  .string()
  .refine(
    (id) => Object.keys(ownerResources).some((prefix) => id.startsWith(prefix)),
    { message: "ownerId must start with c#, mp# or v#" }
  );

const attachmentIdSchema = z.string().startsWith("att#");

const assertOwnerPermission = (
  user: User,
  ownerId: string,
  action: "read" | "update"
): void => {
  const prefix = (
    Object.keys(ownerResources) as (keyof typeof ownerResources)[]
  ).find((p) => ownerId.startsWith(p));
  const resource = prefix && ownerResources[prefix];
  const userPermissions =
    rolePermissions[user.role as keyof typeof rolePermissions];
  if (!resource || !userPermissions || !userPermissions[resource]?.[action]) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
};

export const attachmentsRouter = router({
  listByOwner: protectedProcedure
    .input(z.object({ ownerId: ownerIdSchema }))
    .query(async ({ ctx, input }) => {
      assertOwnerPermission(ctx.user, input.ownerId, "read");
      return await ctx.services.attachment.listByOwner(input.ownerId, ctx.user);
    }),

  createUploadUrl: protectedProcedure
    .input(
      z.object({
        ownerId: ownerIdSchema,
        contentType: z.enum(allowedAttachmentTypes),
        size: z.number().int().positive().max(maxAttachmentBytes),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertOwnerPermission(ctx.user, input.ownerId, "update");
      return await ctx.services.attachment.createUploadUrl(input, ctx.user);
    }),

  confirm: protectedProcedure
    .input(
      z.object({
        ownerId: ownerIdSchema,
        attachmentId: attachmentIdSchema,
        fileName: z.string().min(1).max(255),
        date: z.string().date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertOwnerPermission(ctx.user, input.ownerId, "update");
      return await ctx.services.attachment.confirm(input, ctx.user);
    }),

  delete: protectedProcedure
    .input(
      z.object({ ownerId: ownerIdSchema, attachmentId: attachmentIdSchema })
    )
    .mutation(async ({ ctx, input }) => {
      assertOwnerPermission(ctx.user, input.ownerId, "update");
      return await ctx.services.attachment.delete(
        input.ownerId,
        input.attachmentId,
        ctx.user
      );
    }),
});
