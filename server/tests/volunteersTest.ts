import { createTestCaller, testData } from "./testUtils.ts";

export async function testVolunteersRouter() {
  console.log("🧪 Testing Volunteers Router...");
  const caller = await createTestCaller();

  let createdVolunteer: any;

  try {
    // Test create
    console.log("  ✓ Testing create volunteer");
    createdVolunteer = await caller.volunteers.create(testData.volunteer);
    console.log(`    Created volunteer with ID: ${createdVolunteer.id}`);

    // Test getAll
    console.log("  ✓ Testing getAll volunteers");
    const allVolunteers = await caller.volunteers.getAll();
    console.log(`    Found ${allVolunteers.length} volunteers`);

    // Test getById
    console.log("  ✓ Testing getById volunteer");
    const volunteerById = await caller.volunteers.getById({
      id: createdVolunteer.id,
    });
    console.log(`    Retrieved volunteer: ${volunteerById?.name}`);

    // Test update
    console.log("  ✓ Testing update volunteer");
    const updatedVolunteer = await caller.volunteers.update({
      id: createdVolunteer.id,
      name: "Updated Test Volunteer",
    });
    console.log(`    Updated volunteer name to: ${updatedVolunteer?.name}`);

    // Test delete
    console.log("  ✓ Testing delete volunteer");
    const deleted = await caller.volunteers.delete({ id: createdVolunteer.id });
    console.log(`    Volunteer deleted: ${deleted}`);

    console.log("✅ Volunteers Router tests passed\n");
  } catch (error) {
    console.error("❌ Volunteers Router test failed:", error);
    throw error;
  }
}
