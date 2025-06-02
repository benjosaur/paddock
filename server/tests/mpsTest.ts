import { createTestCaller, testData } from "./testUtils.ts";

export async function testMpsRouter() {
  console.log("🧪 Testing MPs Router...");
  const caller = await createTestCaller();

  let createdMp: any;

  try {
    // Test create
    console.log("  ✓ Testing create MP");
    createdMp = await caller.mps.create(testData.mp);
    console.log(`    Created MP with ID: ${createdMp.id}`);

    // Test getAll
    console.log("  ✓ Testing getAll MPs");
    const allMps = await caller.mps.getAll();
    console.log(`    Found ${allMps.length} MPs`);

    // Test getById
    console.log("  ✓ Testing getById MP");
    const mpById = await caller.mps.getById({ id: createdMp.id });
    console.log(`    Retrieved MP: ${mpById?.name}`);

    // Test update
    console.log("  ✓ Testing update MP");
    const updatedMp = await caller.mps.update({
      id: createdMp.id,
      name: "Updated Test MP",
    });
    console.log(`    Updated MP name to: ${updatedMp?.name}`);

    // Test delete
    console.log("  ✓ Testing delete MP");
    const deleted = await caller.mps.delete({ id: createdMp.id });
    console.log(`    MP deleted: ${deleted}`);

    console.log("✅ MPs Router tests passed\n");
  } catch (error) {
    console.error("❌ MPs Router test failed:", error);
    throw error;
  }
}
