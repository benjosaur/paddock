import { sampleUser } from "../test";
import { VolunteerService } from "./service";
import { VolunteerMetadata } from "shared";

const volunteerService = new VolunteerService();

const sampleVolunteer: Omit<VolunteerMetadata, "id"> = {
  dateOfBirth: "1985-05-15",
  postCode: "E1 6AN",
  recordName: "First Aid",
  recordExpiry: "2025-12-31",
  trainingRecords: [],
  details: {
    name: "Sarah Johnson",
    address: "123 Volunteer Street, London",
    email: "sarah.johnson@email.com",
    phone: "020 7946 0958",
    nextOfKin: "Michael Johnson",
    needs: [],
    services: ["Food Bank", "Community Support"],
    notes: "Experienced volunteer coordinator",
    specialisms: ["Community Outreach", "Event Management"],
    transport: true,
    capacity: "Part time",
  },
};

export async function testVolunteerService() {
  try {
    console.log("Testing Volunteer Service...");

    console.log("1. Creating volunteer...");
    const createdVolunteer = await volunteerService.create(
      sampleVolunteer,
      sampleUser
    );
    console.log("Created volunteer:", createdVolunteer);

    console.log("2. Getting volunteer by ID...");
    const retrievedVolunteer = await volunteerService.getById(
      sampleUser,
      createdVolunteer.id
    );
    console.log("Retrieved volunteer:", retrievedVolunteer);

    console.log("3. Updating volunteer...");
    const updatedVolunteerData: VolunteerMetadata = {
      ...retrievedVolunteer,
      details: {
        ...retrievedVolunteer.details,
        notes: "Updated experienced volunteer coordinator",
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
      createdVolunteer.id
    );
    console.log("Deleted count:", deletedCount);

    console.log("Volunteer Service tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testVolunteerService();
