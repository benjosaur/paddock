import { awsLambdaRequestHandler } from "@trpc/server/adapters/aws-lambda";
import { prodAppRouter } from "./trpc/prod/router";
import { createLambdaContext } from "./trpc/prod/context";
import dotenv from "dotenv";

dotenv.config();

// Origins allowed to call the API. The Lambda echoes back the request's Origin
// when it appears here — a static Access-Control-Allow-Origin can only name one
// origin, which would break the other during the DNS cutover. Each stack sets
// ALLOWED_ORIGINS for its own environment; the fallback keeps an unconfigured
// prod Lambda working. Drop the legacy CloudFront URL once paddockhealth.com is
// fully live.
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") ?? [
  "https://paddockhealth.com",
  "https://www.paddockhealth.com",
  "https://d16bybrorjyr80.cloudfront.net",
];

export const handler = awsLambdaRequestHandler({
  router: prodAppRouter,
  createContext: createLambdaContext,
  responseMeta({ ctx }) {
    const origin =
      ctx?.event?.headers?.origin || ctx?.event?.headers?.Origin || "";
    const allowOrigin = ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0];
    return {
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Methods": "GET,POST",
        "Access-Control-Allow-Headers": "authorization",
      },
    };
  },
});

// ESBUILD_DEPLOY_STOP;

import cors from "cors";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { localAppRouter } from "./trpc/local/router";
import { createExpressContext } from "./trpc/local/context";

const app = express();
const port = process.env.PORT || 3001;

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      "https://paddockhealth.com",
      "https://www.paddockhealth.com",
    ],
    credentials: true,
  })
);

app.use(express.json());

app.use(
  "/trpc",
  createExpressMiddleware({
    router: localAppRouter,
    createContext: createExpressContext,
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

async function startServer() {
  try {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

if (!(process.env.NODE_ENV == "production")) {
  startServer();
}
// */
