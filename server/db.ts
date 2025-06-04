import { initializeDatabase, dropAllTables } from "./db/schema.ts";
import { seedDatabase } from "./db/seed.ts";
import { runAllTests } from "./tests/index.ts";

const command = process.argv[2];

switch (command) {
  case "init":
    await initializeDatabase();
    break;
  case "seed":
    await seedDatabase();
    break;
  case "reset":
    await dropAllTables();
    await initializeDatabase();
    await seedDatabase();
    break;
  case "test":
    await runAllTests();
    break;
  default:
    console.log("Usage: bun run db.ts [init|seed|reset|test]");
    process.exit(1);
}

process.exit(0);
