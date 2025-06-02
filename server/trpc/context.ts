import { inferAsyncReturnType } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { db } from "../db/index.ts";

export const createContext = async ({
  req,
  res,
}: CreateExpressContextOptions) => {
  return {
    req,
    res,
    db,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
