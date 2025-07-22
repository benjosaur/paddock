import { sampleUser } from "../test";
import { MagLogService } from "./service";
import { MagLog } from "shared";

const magLogService = new MagLogService();

const sampleMagLog: Omit<MagLog, "id"> = {
  date: "2025-01-15",
  clients: [
    {
      id: "client#test-client-123",
      postCode: "SW1A 1AA",
      details: { name: "John Smith" },
    },
    {
      id: "client#test-client-456",
      postCode: "E1 6AN",
      details: { name: "Jane Doe" },
    },
  ],
  mps: [],
  volunteers: [],
  details: {
    totalClients: 2,
    totalFamily: 0,
    totalVolunteers: 0,
    totalMps: 0,
    otherAttendees: 1,
    notes: "Monthly magistrate session",
  },
};

export async function testMagLogService() {
  try {
    console.log("Testing Mag Log Service...");

    console.log("1. Creating Mag log...");
    const createdLog = await magLogService.create(sampleMagLog, sampleUser);
    console.log("Created Mag log:", createdLog);

    console.log("2. Getting Mag log by ID...");
    const fetchedLog = await magLogService.getById(createdLog.id, sampleUser);
    console.log("Fetched Mag log:", fetchedLog);

    console.log("3. Updating Mag log...");
    const updatedLogData: MagLog = {
      ...createdLog,
      details: {
        totalClients: 2,
        totalFamily: 1,
        totalVolunteers: 1,
        totalMps: 1,
        otherAttendees: 2,
        notes: "Extended magistrate session with additional cases",
      },
    };
    const updatedLog = await magLogService.update(updatedLogData, sampleUser);
    console.log("Updated Mag log:", updatedLog);

    console.log("4. Getting all Mag logs...");
    const allLogs = await magLogService.getAll(sampleUser);
    console.log("All Mag logs:", allLogs);

    console.log("5. Getting Mag logs by date interval...");
    const logsInInterval = await magLogService.getByDateInterval(sampleUser, {
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });
    console.log("Mag logs in January 2025:", logsInInterval);

    console.log("6. Deleting Mag log...");
    const deletedCount = await magLogService.delete(sampleUser, createdLog.id);
    console.log("Deleted count:", deletedCount);

    console.log("Mag Log Service tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run test only if this file is executed directly
if (require.main === module) {
  testMagLogService();
}
