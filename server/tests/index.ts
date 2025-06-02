import { dropAllTables, initializeDatabase } from "../db/schema.ts";
import { testClientsRouter } from "./clientsTest.ts";
import { testMpsRouter } from "./mpsTest.ts";
import { testVolunteersRouter } from "./volunteersTest.ts";
import { testMpLogsRouter } from "./mpLogsTest.ts";
import { testVolunteerLogsRouter } from "./volunteerLogsTest.ts";
import { testMagLogsRouter } from "./magLogsTest.ts";
import { testClientRequestsRouter } from "./clientRequestsTest.ts";

export async function runAllTests() {
  console.log("🚀 Starting tRPC Router Tests\n");
  console.log("🗑️  Dropping all tables first...");

  try {
    await dropAllTables();
    console.log("✅ All tables dropped successfully\n");

    console.log("🏗️  Initializing database...");
    await initializeDatabase();
    console.log("✅ Database initialized successfully\n");

    const startTime = Date.now();

    // Run all tests in sequence
    await testClientsRouter();
    await testMpsRouter();
    await testVolunteersRouter();
    await testMpLogsRouter();
    await testVolunteerLogsRouter();
    await testMagLogsRouter();
    await testClientRequestsRouter();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("🎉 All tRPC Router Tests Passed!");
    console.log(`⏱️  Total test duration: ${duration}s`);
  } catch (error) {
    console.error("💥 Test suite failed:", error);
    process.exit(1);
  }
}
