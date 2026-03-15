import { awsLambdaRequestHandler } from "@trpc/server/adapters/aws-lambda";
import { prodAppRouter } from "./trpc/prod/router";
import { createLambdaContext } from "./trpc/prod/context";
import dotenv from "dotenv";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

export const handler = awsLambdaRequestHandler({
  router: prodAppRouter,
  createContext: createLambdaContext,
  responseMeta() {
    return {
      headers: {
        "Access-Control-Allow-Origin": "https://paddock.health",
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
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Postman, curl)
      if (!origin) return callback(null, true);
      // Allow any localhost port
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin))
        return callback(null, true);
      // Allow production
      if (origin === "https://paddock.health") return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());

app.use(
  "/trpc",
  createExpressMiddleware({
    router: localAppRouter,
    createContext: createExpressContext,
    onError(opts) {
      const { path, error } = opts;
      const code = (error as { code?: string }).code;
      console.error(`[tRPC] Error on ${path}:`, error.message);
      if (code !== "UNAUTHORIZED" && code !== "FORBIDDEN") {
        console.error("[tRPC] Stack:", error.stack);
      }
    },
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
