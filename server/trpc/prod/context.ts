import { APIGatewayProxyEventV2 } from "aws-lambda";
import { CreateAWSLambdaContextOptions } from "@trpc/server/adapters/aws-lambda";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { createServices } from "../../db/service";

// Create JWT verifier for your Cognito User Pool
const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: "access", // or "id" depending on which token you're using
  clientId: process.env.COGNITO_CLIENT_ID!, // Optional, only if you want to verify client ID
});

export const getUser = async (reqOrEvent: any): Promise<User | null> => {
  if (process.env.NODE_ENV === "development") {
    return { sub: process.env.DEV_SUB!, role: process.env.DEV_ROLE! };
  }

  try {
    const authHeader = reqOrEvent.headers.authorization;
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

export const createLambdaContext = async ({
  event,
  context,
}: CreateAWSLambdaContextOptions<APIGatewayProxyEventV2>) => {
  return {
    event,
    context,
    user: await getUser(event),
    services: createServices(),
  };
};

export type LambdaContext = Awaited<ReturnType<typeof createLambdaContext>>;
