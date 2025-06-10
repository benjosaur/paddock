import { db } from "./index.ts";

export async function seedDatabase() {
  try {
    // Clear existing data
    await db.query(
      "TRUNCATE TABLE mpLogs, volunteerLogs, clientRequests, mps, volunteers, clients, magLogs CASCADE"
    );

    // Seed Clients
    await db.create("clients", {
      name: "Alice Wonderland",
      dob: "1985-07-22",
      address: "123 Main St, Anytown",
      postCode: "AT1 2BC",
      phone: "01234 567890",
      email: "alice.w@example.com",
      nextOfKin: "Mad Hatter (Friend)",
      referredBy: "Queen of Hearts Clinic",
      clientAgreementDate: "2024-01-15",
      clientAgreementComments: "Standard agreement signed.",
      riskAssessmentDate: "2024-01-10",
      riskAssessmentComments: "Low risk, standard precautions.",
      needs: ["Companionship", "Shopping assistance"],
      servicesProvided: ["Weekly visits", "Grocery shopping"],
      hasMp: true,
      hasAttendanceAllowance: false,
    });

    await db.create("clients", {
      name: "Bob The Builder",
      dob: "1970-03-10",
      address: "456 Fixit Ave, Builderville",
      postCode: "BV2 3CD",
      phone: "09876 543210",
      email: "bob.b@example.com",
      nextOfKin: "Wendy (Partner)",
      referredBy: "Self-referral",
      needs: ["Home maintenance advice", "Gardening help"],
      servicesProvided: ["Monthly consultation", "Seasonal garden tidy-up"],
      hasMp: false,
      hasAttendanceAllowance: true,
    });

    await db.create("clients", {
      name: "Charlie Brown",
      dob: "1995-11-05",
      address: "789 Good Grief Ln, Peanuts Town",
      postCode: "PT3 4DE",
      phone: "01122 334455",
      email: "charlie.b@example.com",
      nextOfKin: "Snoopy (Dog)",
      referredBy: "Lucy van Pelt Psychiatry",
      clientAgreementDate: "2023-05-20",
      clientAgreementComments: "Client hesitant but agreed.",
      riskAssessmentDate: "2023-05-15",
      riskAssessmentComments: "Moderate anxiety, requires gentle approach.",
      needs: ["Emotional support", "Social interaction"],
      servicesProvided: ["Befriending service", "Group activities"],
      hasMp: true,
      hasAttendanceAllowance: true,
    });

    // Seed MPs
    await db.create("mps", {
      name: "Sarah Johnson",
      address: "12 Caring Lane, Townsville",
      postCode: "TV1 2AB",
      phone: "01234 567891",
      email: "sarah.j@mpcares.com",
      nextOfKin: "John Johnson (Husband)",
      dbsNumber: "1234567890",
      dbsExpiry: "2026-05-20",
      dob: "1979-03-10",
      servicesOffered: ["Personal Care", "Medication Reminders"],
      specialisms: ["Dementia Care", "Palliative Care"],
      transport: true,
      capacity: "Full",
      trainingRecords: [
        { training: "First Aid", expiry: "2025-10-10" },
        { training: "Safeguarding Adults", expiry: "2026-01-15" },
      ],
    });

    await db.create("mps", {
      name: "David Wilson",
      address: "34 Helping Hand Rd, Cityville",
      postCode: "CV2 3BC",
      phone: "09876 543211",
      email: "david.w@mpcares.com",
      nextOfKin: "Mary Wilson (Wife)",
      dbsExpiry: "2025-11-30",
      dob: "1972-08-15",
      servicesOffered: ["Companionship", "Meal Preparation"],
      specialisms: ["Elderly Care"],
      transport: true,
      capacity: "Part-time Available",
      trainingRecords: [
        { training: "Food Hygiene", expiry: "2025-08-01" },
        { training: "Manual Handling", expiry: "2026-03-22" },
      ],
    });

    await db.create("mps", {
      name: "Michael Thompson",
      address: "56 Support Street, Villagetown",
      postCode: "VT3 4CD",
      phone: "01122 334456",
      email: "michael.t@mpcares.com",
      nextOfKin: "Susan Thompson (Sister)",
      dbsNumber: "0987654321",
      dbsExpiry: "2027-02-10",
      dob: "1987-01-20",
      servicesOffered: ["Social Outings", "Light Housekeeping"],
      specialisms: ["Learning Disabilities Support"],
      transport: true,
      capacity: "Available Weekends",
      trainingRecords: [
        { training: "Basic Life Support", expiry: "2025-07-01" },
      ],
    });

    // Seed Volunteers
    await db.create("volunteers", {
      name: "Alice Cooper",
      dob: "1991-05-12",
      address: "789 Volunteer Ave, Community City",
      postCode: "CC4 5DE",
      phone: "02345 678901",
      email: "alice.c@example.org",
      nextOfKin: "Bob The Builder (Friend)",
      dbsNumber: "VOL987654321",
      dbsExpiry: "2027-08-15",
      servicesOffered: ["Admin Support", "Event Assistance"],
      needTypes: ["Office Tasks", "Public Engagement"],
      transport: true,
      capacity: "Weekends, 5hrs/week",
      specialisms: ["Organisational Skills", "Public Speaking"],
      trainingRecords: [
        { training: "Data Protection", expiry: "2026-06-30" },
        { training: "Health & Safety Basics", expiry: "2025-12-01" },
      ],
    });

    await db.create("volunteers", {
      name: "Bob Stevens",
      dob: "1997-09-08",
      address: "101 Helper St, Support Town",
      postCode: "ST5 6FG",
      phone: "03456 789012",
      email: "bob.s@example.org",
      nextOfKin: "Carol White (Partner)",
      dbsExpiry: "2026-10-20",
      servicesOffered: ["Befriending", "Gardening"],
      needTypes: ["Social Support", "Outdoor Activities"],
      transport: true,
      capacity: "Mon, Wed PM",
      trainingRecords: [
        { training: "Mental Health First Aid", expiry: "2027-01-10" },
        { training: "Safeguarding Vulnerable Adults", expiry: "2026-09-05" },
      ],
    });

    await db.create("volunteers", {
      name: "Carol White",
      dob: "1980-04-25",
      address: "202 Kindness Rd, Generosity Village",
      postCode: "GV6 7HI",
      phone: "04567 890123",
      email: "carol.w@example.org",
      nextOfKin: "Alice Cooper (Friend)",
      dbsNumber: "VOL123456789",
      dbsExpiry: "2025-07-25",
      servicesOffered: ["Driving", "Shopping Assistance"],
      needTypes: ["Transportation", "Practical Support"],
      transport: true,
      capacity: "Flexible, 10hrs/month",
      specialisms: ["Advanced Driving Course"],
      trainingRecords: [
        { training: "First Aid for Drivers", expiry: "2026-04-12" },
      ],
    });

    // Seed MP Logs
    await db.create("mp_logs", {
      date: "2025-01-15",
      clientId: 1,
      mpId: 1,
      services: ["Consultation", "Document Review"],
      hoursLogged: 2.5,
      notes: "Initial consultation regarding housing issues",
    });

    await db.create("mp_logs", {
      date: "2025-01-16",
      clientId: 2,
      mpId: 2,
      services: ["Meeting", "Follow-up"],
      hoursLogged: 1.5,
      notes: "Follow-up meeting for benefits claim",
    });

    await db.create("mp_logs", {
      date: "2025-01-17",
      clientId: 3,
      mpId: 1,
      services: ["Phone Call"],
      hoursLogged: 0.5,
      notes: "Phone consultation about local services",
    });

    await db.create("mp_logs", {
      date: "2025-01-18",
      clientId: 1,
      mpId: 3,
      services: ["Document Review", "Consultation"],
      hoursLogged: 3,
      notes: "Review of planning application documents",
    });

    await db.create("mp_logs", {
      date: "2025-01-19",
      clientId: 2,
      mpId: 2,
      services: ["Meeting"],
      hoursLogged: 1,
      notes: "Constituency surgery appointment",
    });

    // Seed Volunteer Logs
    await db.create("volunteer_logs", {
      date: "2025-01-15",
      clientId: 1,
      volunteerId: 1,
      activity: "Admin Support",
      hoursLogged: 4,
      notes: "Data entry and filing",
    });

    await db.create("volunteer_logs", {
      date: "2025-01-16",
      clientId: 2,
      volunteerId: 2,
      activity: "Event Planning",
      hoursLogged: 6,
      notes: "Planning community outreach event",
    });

    await db.create("volunteer_logs", {
      date: "2025-01-17",
      clientId: 3,
      volunteerId: 3,
      activity: "Client Support",
      hoursLogged: 3,
      notes: "Assisting with client intake",
    });

    // Seed MAG Logs
    await db.create("mag_logs", {
      date: "2025-01-15",
      total: 8,
      attendees: [1, 2, 3],
      notes: "Monthly review and planning session",
    });

    await db.create("mag_logs", {
      date: "2025-01-22",
      total: 5,
      attendees: [1, 2],
      notes: "Q1 strategy planning",
    });

    // Seed Client Requests
    await db.create("client_requests", {
      clientId: 1,
      requestType: "Volunteer",
      startDate: "2025-06-10",
      schedule: "Tuesdays, 2 PM - 4 PM",
      status: "pending",
    });

    await db.create("client_requests", {
      clientId: 2,
      requestType: "MP",
      startDate: "2025-07-01",
      schedule: "First Monday of the month, 10 AM",
      status: "approved",
    });

    await db.create("client_requests", {
      clientId: 1,
      requestType: "Volunteer",
      startDate: "2025-08-01",
      schedule: "Fridays, 10 AM - 12 PM",
      status: "approved",
    });

    await db.create("client_requests", {
      clientId: 3,
      requestType: "Volunteer",
      startDate: "2025-06-15",
      schedule: "Flexible, ad-hoc",
      status: "pending",
    });

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
