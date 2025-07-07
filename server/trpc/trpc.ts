import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import { rolePermissions } from "shared/permissions.ts";
import type { Context } from "./context.ts";

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const middleware = t.middleware;

const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

const hasPermission = (
  resource: string,
  action: "read" | "create" | "update" | "delete"
) =>
  middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const userPermissions =
      rolePermissions[ctx.user.role as keyof typeof rolePermissions];
    if (!userPermissions || !userPermissions[resource]?.[action]) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return next({
      //generic middleware input instead of from isAuthed does not preserve type narrowing of user so repeating here.
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  });

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export const createProtectedProcedure = (
  resource: string,
  action: "read" | "create" | "update" | "delete"
) => t.procedure.use(isAuthed).use(hasPermission(resource, action));
export const createCallerFactory = t.createCallerFactory;
