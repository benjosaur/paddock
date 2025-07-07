import { VolunteerLogService } from "./service";
import { VolunteerLog } from "shared";

const volunteerLogService = new VolunteerLogService();

const sampleVolunteerLog: Omit<VolunteerLog, "id"> = {
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
  volunteers: [
    {
      id: "volunteer#test-volunteer-789",
      details: { name: "Alice Johnson" },
    },
  ],
  details: {
    hoursLogged: 4.5,
    notes: "Regular community visit",
    services: ["advice", "support"],
  },
};

export async function testVolunteerLogService() {
  try {
    console.log("Testing Volunteer Log Service...");

    console.log("1. Creating volunteer log...");
    const createdLog = await volunteerLogService.create(
      sampleVolunteerLog,
      "test-user-123"
    );
    console.log("Created volunteer log:", createdLog);

    console.log("2. Getting volunteer log by ID...");
    const fetchedLog = await volunteerLogService.getById(user:User, createdLog.id);
    console.log("Fetched volunteer log:", fetchedLog);

    console.log("3. Updating volunteer log...");
    const updatedLogData: VolunteerLog = {
      ...createdLog,
      details: {
        hoursLogged: 6.0,
        notes: "Extended community visit with additional support",
        services: ["advice", "support", "advocacy"],
      },
    };
    const updatedLog = await volunteerLogService.update(
      updatedLogData,
      "test-user-123"
    );
    console.log("Updated volunteer log:", updatedLog);

    console.log("4. Getting all volunteer logs...");
    const allLogs = await volunteerLogService.getAll();
    console.log("All volunteer logs:", allLogs);

    console.log("5. Getting volunteer logs by date interval...");
    const logsInInterval = await volunteerLogService.getByDateInterval({
      startDate: "2025-01-01T00:00:00.000Z",
      endDate: "2025-01-31T23:59:59.000Z",
    });
    console.log("Volunteer logs in January 2025:", logsInInterval);

    console.log("6. Getting volunteer logs by volunteer ID...");
    const volunteerLogs = await volunteerLogService.getByVolunteerId(
      "volunteer#test-volunteer-789"
    );
    console.log("Volunteer logs for test volunteer:", volunteerLogs);

    console.log("7. Getting volunteer logs by substring...");
    const searchLogs = await volunteerLogService.getBySubstring("community");
    console.log("Volunteer logs matching 'community':", searchLogs);

    console.log("8. Deleting volunteer log...");
    const deletedCount = await volunteerLogService.delete(user:User, createdLog.id);
    console.log("Deleted count:", deletedCount);

    console.log("Volunteer Log Service tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testVolunteerLogService();
