import { initializeDatabase, dropAllTables } from "./db/schema.ts";
import { seedDatabase } from "./db/seed.ts";

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
  default:
    console.log("Usage: bun run db.ts [init|seed|reset]");
    process.exit(1);
}
