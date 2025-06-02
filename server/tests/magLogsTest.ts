import { createTestCaller, testData } from "./testUtils.ts";

export async function testMagLogsRouter() {
  console.log("🧪 Testing MAG Logs Router...");
  const caller = await createTestCaller();

  let createdClient: any;
  let createdMagLog: any;

  try {
    // Create client for attendees
    console.log("  📝 Setting up test data...");
    createdClient = await caller.clients.create(testData.client);

    const magLogData = {
      ...testData.magLog,
      attendees: [createdClient.id],
    };

    // Test create
    console.log("  ✓ Testing create MAG log");
    createdMagLog = await caller.magLogs.create(magLogData);
    console.log(`    Created MAG log with ID: ${createdMagLog.id}`);

    // Test getAll
    console.log("  ✓ Testing getAll MAG logs");
    const allMagLogs = await caller.magLogs.getAll();
    console.log(`    Found ${allMagLogs.length} MAG logs`);

    // Test getById
    console.log("  ✓ Testing getById MAG log");
    const magLogById = await caller.magLogs.getById({ id: createdMagLog.id });
    console.log(`    Retrieved MAG log for date: ${magLogById?.date}`);

    // Test update
    console.log("  ✓ Testing update MAG log");
    const updatedMagLog = await caller.magLogs.update({
      id: createdMagLog.id,
      notes: "Updated MAG test notes",
    });
    console.log(`    Updated MAG log notes to: ${updatedMagLog?.notes}`);

    // Test delete
    console.log("  ✓ Testing delete MAG log");
    const deleted = await caller.magLogs.delete({ id: createdMagLog.id });
    console.log(`    MAG log deleted: ${deleted}`);

    // Cleanup dependencies
    await caller.clients.delete({ id: createdClient.id });

    console.log("✅ MAG Logs Router tests passed\n");
  } catch (error) {
    console.error("❌ MAG Logs Router test failed:", error);
    // Cleanup on error
    if (createdMagLog)
      await caller.magLogs.delete({ id: createdMagLog.id }).catch(() => {});
    if (createdClient)
      await caller.clients.delete({ id: createdClient.id }).catch(() => {});
    throw error;
  }
}
