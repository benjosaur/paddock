import { inferAsyncReturnType } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { db } from "../db/index.ts";

export interface User {
  role: string;
  sub: string; // Cognito user ID
}

// Create JWT verifier for your Cognito User Pool
const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: "access", // or "id" depending on which token you're using
  clientId: process.env.COGNITO_CLIENT_ID!, // Optional, only if you want to verify client ID
});

export const createContext = async ({
  req,
  res,
}: CreateExpressContextOptions) => {
  const getUser = async (): Promise<User | null> => {
    if (process.env.NODE_ENV === "development") {
      return { sub: process.env.DEV_SUB!, role: process.env.DEV_ROLE! };
    }

    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
      }

      // Extract token from "Bearer <token>"
      const token = authHeader.substring(7);

      // Verify the JWT token with Cognito
      const payload = await jwtVerifier.verify(token);

      const user: User = {
        sub: payload.sub,
        role: payload["cognito:groups"]?.[0] || "",
      };
      console.log(user);
      return user;
    } catch (error) {
      console.error("JWT verification failed:", error);
      return null;
    }
  };

  return {
    req,
    res,
    db,
    user: await getUser(),
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
