import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { runAttachmentDatesMigration } from "../db/migrations/attachmentDates";

// One-off backfill of the mandatory attachment `date` field against the REAL
// AWS tables (never DynamoDB Local). Run it per table, dry-run first, BEFORE
// deploying the server that requires `date`:
//
//   cd server && aws sso login
//   bun run scripts/migrate-attachment-dates-remote.ts WiveyCares2-Staging --dry-run
//   bun run scripts/migrate-attachment-dates-remote.ts WiveyCares2-Staging
//   ... then Test2-Staging; prod: WiveyCares2, Test2
//
// Credentials come from the ambient AWS profile (SSO); region stays in the EU
// (eu-west-2) per data residency.
const tableName = process.argv[2];
const dryRun = process.argv.includes("--dry-run");

if (!tableName || tableName.startsWith("--")) {
  console.error(
    "Usage: bun run scripts/migrate-attachment-dates-remote.ts <tableName> [--dry-run]"
  );
  process.exit(1);
}

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION ?? "eu-west-2" })
);

await runAttachmentDatesMigration(client, tableName, { dryRun });
