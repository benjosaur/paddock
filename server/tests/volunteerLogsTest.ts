import { createTestCaller, testData } from "./testUtils.ts";

export async function testVolunteerLogsRouter() {
  console.log("🧪 Testing Volunteer Logs Router...");
  const caller = await createTestCaller();

  let createdClient: any;
  let createdVolunteer: any;
  let createdVolunteerLog: any;

  try {
    // Create dependencies first
    console.log("  📝 Setting up test data...");
    createdClient = await caller.clients.create(testData.client);
    createdVolunteer = await caller.volunteers.create(testData.volunteer);

    const volunteerLogData = {
      ...testData.volunteerLog,
      clientId: createdClient.id,
      volunteerId: createdVolunteer.id,
    };

    // Test create
    console.log("  ✓ Testing create volunteer log");
    createdVolunteerLog = await caller.volunteerLogs.create(volunteerLogData);
    console.log(`    Created volunteer log with ID: ${createdVolunteerLog.id}`);

    // Test getAll
    console.log("  ✓ Testing getAll volunteer logs");
    const allVolunteerLogs = await caller.volunteerLogs.getAll();
    console.log(`    Found ${allVolunteerLogs.length} volunteer logs`);

    // Test getById
    console.log("  ✓ Testing getById volunteer log");
    const volunteerLogById = await caller.volunteerLogs.getById({
      id: createdVolunteerLog.id,
    });
    console.log(
      `    Retrieved volunteer log for date: ${volunteerLogById?.date}`
    );

    // Test getByVolunteerId
    console.log("  ✓ Testing getByVolunteerId volunteer logs");
    const volunteerLogsByVolunteer =
      await caller.volunteerLogs.getByVolunteerId({
        volunteerId: createdVolunteer.id,
      });
    console.log(
      `    Found ${volunteerLogsByVolunteer.length} logs for volunteer`
    );

    // Test getByClientId
    console.log("  ✓ Testing getByClientId volunteer logs");
    const volunteerLogsByClient = await caller.volunteerLogs.getByClientId({
      clientId: createdClient.id,
    });
    console.log(`    Found ${volunteerLogsByClient.length} logs for client`);

    // Test update
    console.log("  ✓ Testing update volunteer log");
    const updatedVolunteerLog = await caller.volunteerLogs.update({
      id: createdVolunteerLog.id,
      notes: "Updated volunteer test notes",
    });
    console.log(
      `    Updated volunteer log notes to: ${updatedVolunteerLog?.notes}`
    );

    // Test delete
    console.log("  ✓ Testing delete volunteer log");
    const deleted = await caller.volunteerLogs.delete({
      id: createdVolunteerLog.id,
    });
    console.log(`    Volunteer log deleted: ${deleted}`);

    // Cleanup dependencies
    await caller.clients.delete({ id: createdClient.id });
    await caller.volunteers.delete({ id: createdVolunteer.id });

    console.log("✅ Volunteer Logs Router tests passed\n");
  } catch (error) {
    console.error("❌ Volunteer Logs Router test failed:", error);
    // Cleanup on error
    if (createdVolunteerLog)
      await caller.volunteerLogs
        .delete({ id: createdVolunteerLog.id })
        .catch(() => {});
    if (createdClient)
      await caller.clients.delete({ id: createdClient.id }).catch(() => {});
    if (createdVolunteer)
      await caller.volunteers
        .delete({ id: createdVolunteer.id })
        .catch(() => {});
    throw error;
  }
}
