import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { awsLambdaRequestHandler } from "@trpc/server/adapters/aws-lambda";
import { appRouter } from "./trpc/router";
import { createExpressContext, createLambdaContext } from "./trpc/context";
import dotenv from "dotenv";

dotenv.config();

export const isProd = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

export const handler = awsLambdaRequestHandler({
  router: appRouter,
  createContext: createLambdaContext,
});

const app = express();
const port = process.env.PORT || 3001;

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      "https://paddock.health",
    ],
    credentials: true,
  })
);

app.use(express.json());

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
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

if (!isProd) {
  startServer();
}
