import { MagLogService } from "./service";
import { MagLog } from "shared";

const magLogService = new MagLogService();

const sampleMagLog: Omit<MagLog, "id"> = {
  date: "2025-01-15T10:00:00.000Z",
  clients: [
    {
      id: "client#test-client-123",
      details: { name: "John Smith", notes: "First visit" },
    },
    {
      id: "client#test-client-456",
      details: { name: "Jane Doe", notes: "Regular check-in" },
    },
  ],
  details: {
    total: 150.75,
    notes: "Monthly magistrate session",
  },
};

export async function testMagLogService() {
  try {
    console.log("Testing Mag Log Service...");

    console.log("1. Creating Mag log...");
    const createdLog = await magLogService.create(
      sampleMagLog,
      "test-user-123"
    );
    console.log("Created Mag log:", createdLog);

    console.log("2. Getting Mag log by ID...");
    const fetchedLog = await magLogService.getById(createdLog.id);
    console.log("Fetched Mag log:", fetchedLog);

    console.log("3. Updating Mag log...");
    const updatedLogData: MagLog = {
      ...createdLog,
      details: {
        total: 200.5,
        notes: "Extended magistrate session with additional cases",
      },
    };
    const updatedLog = await magLogService.update(
      updatedLogData,
      "test-user-123"
    );
    console.log("Updated Mag log:", updatedLog);

    console.log("4. Getting all Mag logs...");
    const allLogs = await magLogService.getAll();
    console.log("All Mag logs:", allLogs);

    console.log("5. Getting Mag logs by date interval...");
    const logsInInterval = await magLogService.getByDateInterval({
      startDate: "2025-01-01T00:00:00.000Z",
      endDate: "2025-01-31T23:59:59.000Z",
    });
    console.log("Mag logs in January 2025:", logsInInterval);

    console.log("6. Deleting Mag log...");
    const deletedCount = await magLogService.delete(createdLog.id);
    console.log("Deleted count:", deletedCount);

    console.log("Mag Log Service tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}
