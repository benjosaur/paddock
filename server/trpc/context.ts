import { inferAsyncReturnType } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { db } from "../db/index.ts";

interface User {
  id: string;
  email: string;
  role: string;
}

export const createContext = async ({
  req,
  res,
}: CreateExpressContextOptions) => {
  const getUser = (): User | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    
    // For now, we'll extract role from a custom header
    // In production, you'd verify the JWT token here
    const userRole = req.headers['x-user-role'] as string;
    const userEmail = req.headers['x-user-email'] as string;
    
    if (!userRole || !userEmail) return null;
    
    return {
      id: userEmail,
      email: userEmail,
      role: userRole,
    };
  };

  return {
    req,
    res,
    db,
    user: getUser(),
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
