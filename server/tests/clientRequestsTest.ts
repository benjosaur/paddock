import { createTestCaller, testData } from "./testUtils.ts";

export async function testClientRequestsRouter() {
  console.log("🧪 Testing Client Requests Router...");
  const caller = await createTestCaller();

  let createdClient: any;
  let createdClientRequest: any;

  try {
    // Create client first
    console.log("  📝 Setting up test data...");
    createdClient = await caller.clients.create(testData.client);

    const clientRequestData = {
      ...testData.clientRequest,
      clientId: createdClient.id,
    };

    // Test create
    console.log("  ✓ Testing create client request");
    createdClientRequest = await caller.clientRequests.create(
      clientRequestData
    );
    console.log(
      `    Created client request with ID: ${createdClientRequest.id}`
    );

    // Test getAll
    console.log("  ✓ Testing getAll client requests");
    const allClientRequests = await caller.clientRequests.getAll();
    console.log(`    Found ${allClientRequests.length} client requests`);

    // Test getById
    console.log("  ✓ Testing getById client request");
    const clientRequestById = await caller.clientRequests.getById({
      id: createdClientRequest.id,
    });
    console.log(
      `    Retrieved client request for start date: ${clientRequestById?.startDate}`
    );

    // Test getByClientId
    console.log("  ✓ Testing getByClientId client requests");
    const clientRequestsByClient = await caller.clientRequests.getByClientId({
      clientId: createdClient.id,
    });
    console.log(
      `    Found ${clientRequestsByClient.length} requests for client`
    );

    // Test getByStatus
    console.log("  ✓ Testing getByStatus client requests");
    const clientRequestsByStatus = await caller.clientRequests.getByStatus({
      status: "pending",
    });
    console.log(`    Found ${clientRequestsByStatus.length} pending requests`);

    // Test update
    console.log("  ✓ Testing update client request");
    const updatedClientRequest = await caller.clientRequests.update({
      id: createdClientRequest.id,
      status: "approved",
    });
    console.log(
      `    Updated client request status to: ${updatedClientRequest?.status}`
    );

    // Test delete
    console.log("  ✓ Testing delete client request");
    const deleted = await caller.clientRequests.delete({
      id: createdClientRequest.id,
    });
    console.log(`    Client request deleted: ${deleted}`);

    // Cleanup dependencies
    await caller.clients.delete({ id: createdClient.id });

    console.log("✅ Client Requests Router tests passed\n");
  } catch (error) {
    console.error("❌ Client Requests Router test failed:", error);
    // Cleanup on error
    if (createdClientRequest)
      await caller.clientRequests
        .delete({ id: createdClientRequest.id })
        .catch(() => {});
    if (createdClient)
      await caller.clients.delete({ id: createdClient.id }).catch(() => {});
    throw error;
  }
}
