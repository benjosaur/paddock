import { z } from "zod";
import { router, createProtectedProcedure } from "../prod/trpc";
import {
  packageSchema,
  reqPackageSchema,
  solePackageSchema,
} from "shared/schemas/index";
import { coverDetailsSchema } from "shared/schemas/convenience";
import { endPackageDetailsSchema } from "shared";
export const packagesRouter = router({
  getAll: createProtectedProcedure("packages", "read").query(
    async ({ ctx }) => {
      return await ctx.services.packages.getAll(ctx.user);
    }
  ),

  getAllWithoutInfoNotEndedYet: createProtectedProcedure(
    "packages",
    "read"
  ).query(async ({ ctx }) => {
    return await ctx.services.packages.getAllWithoutInfoNotEndedYet(ctx.user);
  }),

  getAllInfo: createProtectedProcedure("packages", "read").query(
    async ({ ctx }) => {
      return await ctx.services.packages.getAllInfo(ctx.user);
    }
  ),

  getAllWithoutInfo: createProtectedProcedure("packages", "read").query(
    async ({ ctx }) => {
      return await ctx.services.packages.getAllWithoutInfo(ctx.user);
    }
  ),
  getById: createProtectedProcedure("packages", "read")
    .input(
      z.union([
        reqPackageSchema.pick({ id: true }),
        solePackageSchema.pick({ id: true }),
      ])
    )
    .query(async ({ ctx, input }) => {
      return await ctx.services.packages.getById(input.id, ctx.user);
    }),
  create: createProtectedProcedure("packages", "create")
    .input(reqPackageSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.packages.create(input, ctx.user);
    }),
  createSole: createProtectedProcedure("packages", "create")
    .input(solePackageSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.packages.createSole(input, ctx.user);
    }),
  update: createProtectedProcedure("packages", "update")
    .input(packageSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.packages.update(input, ctx.user);
    }),
  renew: createProtectedProcedure("packages", "update")
    .input(
      z.object({
        oldPackage: z.union([reqPackageSchema, solePackageSchema]),
        newPackage: z.union([
          reqPackageSchema.omit({ id: true }),
          solePackageSchema.omit({ id: true }),
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.packages.renew(
        input.oldPackage,
        input.newPackage,
        ctx.user
      );
    }),
  addCoverPeriod: createProtectedProcedure("packages", "update")
    .input(
      z.object({
        oldPackage: packageSchema,
        coverDetails: coverDetailsSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.packages.addCoverPeriod(
        input.oldPackage,
        input.coverDetails,
        ctx.user
      );
    }),
  delete: createProtectedProcedure("packages", "delete")
    .input(
      z.union([
        reqPackageSchema.pick({ id: true }),
        solePackageSchema.pick({ id: true }),
      ])
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.packages.delete(ctx.user, input.id);
    }),
  end: createProtectedProcedure("packages", "update")
    .input(endPackageDetailsSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.packages.endPackageIfNotAlready(
        ctx.user,
        input
      );
    }),
});
