import { db } from "./index.ts";

export async function seedDatabase() {
  try {
    // Clear existing data
    await db.query(
      "TRUNCATE TABLE mpLogs, volunteerLogs, clientRequests, mps, volunteers, clients, magLogs CASCADE"
    );

    // Seed clients
    const client1Id = crypto.randomUUID();
    const client2Id = crypto.randomUUID();

    await db.create("clients", {
      id: client1Id,
      name: "John Smith",
      dob: "1980-05-15",
      address: "123 Main Street",
      postCode: "SW1A 1AA",
      phone: "020 7946 0958",
      email: "john.smith@email.com",
      nextOfKin: "Jane Smith",
      referredBy: "NHS",
      needs: ["Personal Care", "Companionship"],
      servicesProvided: ["Personal Care"],
      hasMp: true,
      hasAttendanceAllowance: false,
    });

    await db.create("clients", {
      id: client2Id,
      name: "Mary Johnson",
      dob: "1975-12-03",
      address: "456 Oak Avenue",
      postCode: "E1 6AN",
      phone: "020 7946 0959",
      email: "mary.johnson@email.com",
      nextOfKin: "Robert Johnson",
      referredBy: "Social Services",
      needs: ["Shopping", "Transport"],
      servicesProvided: ["Shopping"],
      hasMp: false,
      hasAttendanceAllowance: true,
    });

    // Seed MPs
    const mp1Id = crypto.randomUUID();

    await db.create("mps", {
      id: mp1Id,
      name: "Sarah Williams",
      dob: "1989-03-15",
      address: "789 Pine Road",
      postCode: "N1 9AG",
      phone: "020 7946 0960",
      email: "sarah.williams@email.com",
      nextOfKin: "David Williams",
      dbsNumber: "DBS123456",
      dbsExpiry: "2025-12-31",
      servicesOffered: ["Personal Care", "Companionship"],
      specialisms: ["Dementia Care"],
      transport: "Car",
      capacity: "Full-time",
      trainingRecords: [
        { training: "First Aid", expiry: "2025-06-30" },
        { training: "Safeguarding", expiry: "2025-12-31" },
      ],
    });

    // Seed volunteers
    const volunteer1Id = crypto.randomUUID();

    await db.create("volunteers", {
      id: volunteer1Id,
      name: "Tom Brown",
      dob: "1997-02-10",
      address: "321 Elm Street",
      postCode: "W1A 0AX",
      phone: "020 7946 0961",
      email: "tom.brown@email.com",
      nextOfKin: "Lisa Brown",
      dbsNumber: "DBS789012",
      dbsExpiry: "2025-08-15",
      servicesOffered: ["Shopping", "Transport"],
      needTypes: ["Shopping", "Befriending"],
      transport: "Public Transport",
      capacity: "Part-time",
      specialisms: ["Mental Health Support"],
      trainingRecords: [
        { training: "Mental Health First Aid", expiry: "2025-09-30" },
      ],
    });

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
