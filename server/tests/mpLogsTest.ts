import { createTestCaller, testData } from "./testUtils.ts";

export async function testMpLogsRouter() {
  console.log("🧪 Testing MP Logs Router...");
  const caller = await createTestCaller();

  let createdClient: any;
  let createdMp: any;
  let createdMpLog: any;

  try {
    // Create dependencies first
    console.log("  📝 Setting up test data...");
    createdClient = await caller.clients.create(testData.client);
    createdMp = await caller.mps.create(testData.mp);

    const mpLogData = {
      ...testData.mpLog,
      clientId: createdClient.id,
      mpId: createdMp.id,
    };

    // Test create
    console.log("  ✓ Testing create MP log");
    createdMpLog = await caller.mpLogs.create(mpLogData);
    console.log(`    Created MP log with ID: ${createdMpLog.id}`);

    // Test getAll
    console.log("  ✓ Testing getAll MP logs");
    const allMpLogs = await caller.mpLogs.getAll();
    console.log(`    Found ${allMpLogs.length} MP logs`);

    // Test getById
    console.log("  ✓ Testing getById MP log");
    const mpLogById = await caller.mpLogs.getById({ id: createdMpLog.id });
    console.log(`    Retrieved MP log for date: ${mpLogById?.date}`);

    // Test getByMpId
    console.log("  ✓ Testing getByMpId MP logs");
    const mpLogsByMp = await caller.mpLogs.getByMpId({ mpId: createdMp.id });
    console.log(`    Found ${mpLogsByMp.length} logs for MP`);

    // Test getByClientId
    console.log("  ✓ Testing getByClientId MP logs");
    const mpLogsByClient = await caller.mpLogs.getByClientId({
      clientId: createdClient.id,
    });
    console.log(`    Found ${mpLogsByClient.length} logs for client`);

    // Test update
    console.log("  ✓ Testing update MP log");
    const updatedMpLog = await caller.mpLogs.update({
      id: createdMpLog.id,
      notes: "Updated test notes",
    });
    console.log(`    Updated MP log notes to: ${updatedMpLog?.notes}`);

    // Test delete
    console.log("  ✓ Testing delete MP log");
    const deleted = await caller.mpLogs.delete({ id: createdMpLog.id });
    console.log(`    MP log deleted: ${deleted}`);

    // Cleanup dependencies
    await caller.clients.delete({ id: createdClient.id });
    await caller.mps.delete({ id: createdMp.id });

    console.log("✅ MP Logs Router tests passed\n");
  } catch (error) {
    console.error("❌ MP Logs Router test failed:", error);
    // Cleanup on error
    if (createdMpLog)
      await caller.mpLogs.delete({ id: createdMpLog.id }).catch(() => {});
    if (createdClient)
      await caller.clients.delete({ id: createdClient.id }).catch(() => {});
    if (createdMp)
      await caller.mps.delete({ id: createdMp.id }).catch(() => {});
    throw error;
  }
}
