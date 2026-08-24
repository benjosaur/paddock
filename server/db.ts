import { runSeed } from "./db/seed";
import { runAttachmentDatesMigration } from "./db/migrations/attachmentDates";

const subcommand = process.argv[2];

async function main() {
  switch (subcommand) {
    case "seed":
      await runSeed();
      break;
    case "migrate:attachment-dates": {
      const tableName = process.argv[3];
      if (!tableName || tableName.startsWith("--")) {
        console.error(
          "Usage: bun run db.ts migrate:attachment-dates <tableName> [--dry-run]"
        );
        process.exit(1);
      }
      await runAttachmentDatesMigration(tableName, {
        dryRun: process.argv.includes("--dry-run"),
      });
      break;
    }
    default:
      console.error(`Unknown subcommand: ${subcommand}`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
