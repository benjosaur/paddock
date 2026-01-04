import { runImport } from "./deprivation-dynamo-import";

await runImport({
  endpoint: "http://localhost:8000",
  region: process.env.AWS_REGION ?? "eu-west-2",
  createTable: true,
});

