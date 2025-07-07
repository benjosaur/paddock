import { MpLogService } from "./service";
import { MpLog } from "shared";

const mpLogService = new MpLogService();

const sampleMpLog: Omit<MpLog, "id"> = {
  date: "2025-01-15T10:00:00.000Z",
  clients: [
    {
      id: "client#test-client-123",
      postCode: "SW1A 1AA",
      details: { name: "John Smith" },
    },
    {
      id: "client#test-client-456",
      postCode: "M1 1AA",
      details: { name: "Jane Doe" },
    },
  ],
  mps: [
    {
      id: "mp#test-mp-789",
      details: { name: "Alice Johnson" },
    },
  ],
  details: {
    hoursLogged: 4.5,
    notes: "Regular community visit",
    services: ["advice", "support"],
  },
};

export async function testMpLogService() {
  try {
    console.log("Testing MP Log Service...");

    console.log("1. Creating MP log...");
    const createdLog = await mpLogService.create(sampleMpLog, "test-user-123");
    console.log("Created MP log:", createdLog);

    console.log("2. Getting MP log by ID...");
    const fetchedLog = await mpLogService.getById(user:User, createdLog.id);
    console.log("Fetched MP log:", fetchedLog);

    console.log("3. Updating MP log...");
    const updatedLogData: MpLog = {
      ...createdLog,
      details: {
        hoursLogged: 6.0,
        notes: "Extended community visit with additional support",
        services: ["advice", "support", "advocacy"],
      },
    };
    const updatedLog = await mpLogService.update(
      updatedLogData,
      "test-user-123"
    );
    console.log("Updated MP log:", updatedLog);

    console.log("4. Getting all MP logs...");
    const allLogs = await mpLogService.getAll();
    console.log("All MP logs:", allLogs);

    console.log("5. Getting MP logs by date interval...");
    const logsInInterval = await mpLogService.getByDateInterval({
      startDate: "2025-01-01T00:00:00.000Z",
      endDate: "2025-01-31T23:59:59.000Z",
    });
    console.log("MP logs in January 2025:", logsInInterval);

    console.log("6. Getting MP logs by MP ID...");
    const mpLogs = await mpLogService.getByMpId("mp#test-mp-789");
    console.log("MP logs for test MP:", mpLogs);

    console.log("7. Getting MP logs by substring...");
    const searchLogs = await mpLogService.getBySubstring("community");
    console.log("MP logs matching 'community':", searchLogs);

    console.log("8. Deleting MP log...");
    const deletedCount = await mpLogService.delete(user:User, createdLog.id);
    console.log("Deleted count:", deletedCount);

    console.log("MP Log Service tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testMpLogService();
