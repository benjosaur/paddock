import { sampleUser } from "../../utils/test";
import { VolunteerService } from "./service";
import { VolunteerMetadata } from "shared";

const volunteerService = new VolunteerService();

const sampleVolunteer: Omit<VolunteerMetadata, "id"> = {
  dateOfBirth: "1985-05-15",
  endDate: "open",
  dbsExpiry: "2025-12-31",
  publicLiabilityExpiry: "2025-12-31",
  trainingRecords: [],
  details: {
    name: "Sarah Johnson",
    address: {
      streetAddress: "123 Volunteer Street",
      locality: "Wiveliscombe",
      county: "Greater London",
      postCode: "E1 6AN",
    },
    email: "sarah.johnson@email.com",
    phone: "020 7946 0958",
    nextOfKin: "Michael Johnson",
    services: ["Attendance Allowance"],
    attendsMag: false,
    notes: [
      {
        date: "2025-07-21",
        note: "Experienced volunteer coordinator",
        source: "Phone",
        minutesTaken: 0.5,
      },
    ],
    capacity: "Part time",
    role: "Volunteer",
    dbsNumber: "",
    publicLiabilityNumber: "",
  },
  packages: [],
};

export async function testVolunteerService() {
  try {
    console.log("Testing Volunteer Service...");

    console.log("1. Creating volunteer...");
    const createdVolunteerId = await volunteerService.create(
      sampleVolunteer,
      sampleUser
    );
    console.log("Created volunteer ID:", createdVolunteerId);

    console.log("2. Getting volunteer by ID...");
    const retrievedVolunteer = await volunteerService.getById(
      createdVolunteerId,
      sampleUser
    );
    console.log("Retrieved volunteer:", retrievedVolunteer);

    console.log("3. Updating volunteer...");
    const updatedVolunteerData: VolunteerMetadata = {
      id: retrievedVolunteer.id,
      dateOfBirth: retrievedVolunteer.dateOfBirth,
      endDate: retrievedVolunteer.endDate,
      dbsExpiry: retrievedVolunteer.dbsExpiry,
      publicLiabilityExpiry: retrievedVolunteer.publicLiabilityExpiry,
      trainingRecords: retrievedVolunteer.trainingRecords,
      packages: [], // VolunteerMetadata requires packages, VolunteerFull has requests instead
      details: {
        ...retrievedVolunteer.details,
        notes: [
          ...retrievedVolunteer.details.notes,
          {
            date: "2025-07-21",
            note: "Updated experienced volunteer coordinator",
            source: "Email",
            minutesTaken: 1.0,
          },
        ],
      },
    };
    const updatedVolunteer = await volunteerService.update(
      updatedVolunteerData,
      sampleUser
    );
    console.log("Updated volunteer:", updatedVolunteer);

    console.log("4. Getting all volunteers...");
    const allVolunteers = await volunteerService.getAll(sampleUser);
    console.log("All volunteers:", allVolunteers);

    console.log("5. Deleting volunteer...");
    const deletedCount = await volunteerService.delete(
      sampleUser,
      createdVolunteerId
    );
    console.log("Deleted count:", deletedCount);

    console.log("Volunteer Service tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run test only if this file is executed directly (ESM/Bun)
if (import.meta.main) {
  testVolunteerService();
}
