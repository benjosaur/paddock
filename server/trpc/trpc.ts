import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
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

const hasPermission = (resource: string, action: string) => 
  middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // Role-based permissions logic
    const rolePermissions: Record<string, Record<string, string[]>> = {
      Admin: {
        clients: ['read', 'create', 'update', 'delete'],
        mps: ['read', 'create', 'update', 'delete'],
        volunteers: ['read', 'create', 'update', 'delete'],
        mpLogs: ['read', 'create', 'update', 'delete'],
        volunteerLogs: ['read', 'create', 'update', 'delete'],
        magLogs: ['read', 'create', 'update', 'delete'],
        clientRequests: ['read', 'create', 'update', 'delete'],
        expiries: ['read'],
      },
      Trustee: {
        clients: ['read'],
        mps: ['read'],
        volunteers: ['read'],
        mpLogs: ['read'],
        volunteerLogs: ['read'],
        magLogs: ['read'],
        clientRequests: ['read', 'update'],
        expiries: ['read'],
      },
      Coordinator: {
        clients: ['read', 'create', 'update'],
        mps: ['read', 'create', 'update'],
        volunteers: ['read', 'create', 'update'],
        mpLogs: ['read', 'create', 'update'],
        volunteerLogs: ['read', 'create', 'update'],
        magLogs: ['read', 'create', 'update'],
        clientRequests: ['read', 'create', 'update'],
        expiries: ['read'],
      },
      Fundraiser: {
        clients: ['read'],
        volunteers: ['read'],
        volunteerLogs: ['read'],
        magLogs: ['read'],
        clientRequests: ['read'],
      },
    };

    const userPermissions = rolePermissions[ctx.user.role];
    if (!userPermissions || !userPermissions[resource]?.includes(action)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return next({ ctx });
  });

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export const createProtectedProcedure = (resource: string, action: string) =>
  t.procedure.use(isAuthed).use(hasPermission(resource, action));
export const createCallerFactory = t.createCallerFactory;
