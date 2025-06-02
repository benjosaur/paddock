import { createTestCaller, testData } from "./testUtils.ts";

export async function testClientsRouter() {
  console.log("🧪 Testing Clients Router...");
  const caller = await createTestCaller();

  let createdClient: any;

  try {
    // Test create
    console.log("  ✓ Testing create client");
    createdClient = await caller.clients.create(testData.client);
    console.log(`    Created client with ID: ${createdClient.id}`);

    // Test getAll
    console.log("  ✓ Testing getAll clients");
    const allClients = await caller.clients.getAll();
    console.log(`    Found ${allClients.length} clients`);

    // Test getById
    console.log("  ✓ Testing getById client");
    const clientById = await caller.clients.getById({ id: createdClient.id });
    console.log(`    Retrieved client: ${clientById?.name}`);

    // Test update
    console.log("  ✓ Testing update client");
    const updatedClient = await caller.clients.update({
      id: createdClient.id,
      name: "Updated Test Client",
    });
    console.log(`    Updated client name to: ${updatedClient?.name}`);

    // Test delete
    console.log("  ✓ Testing delete client");
    const deleted = await caller.clients.delete({ id: createdClient.id });
    console.log(`    Client deleted: ${deleted}`);

    console.log("✅ Clients Router tests passed\n");
  } catch (error) {
    console.error("❌ Clients Router test failed:", error);
    throw error;
  }
}
