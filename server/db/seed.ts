import { ClientMetadata, MpMetadata, VolunteerMetadata } from "shared";
import { createServices } from "./service";
import { getTableName } from "./repository";

// The seed writes through the real service layer (validation + deprivation
// lookups included). A "Test" role routes every write to the Test2 table via
// getTableName, so this never touches production data. See db:seed in
// package.json — it runs with NODE_ENV=production so the DynamoDB client points
// at AWS rather than local DynamoDB. Requires AWS credentials for the account
// that owns Test2 (eu-west-2).
// db:seed:staging keeps the Test role but points TABLE_NAME_TEST at the
// staging MAIN table, so staging Admin/Coordinator accounts see the data.
// Forgetting the override merely seeds prod's throwaway Test2 — never prod.
const seedUser: User = { role: "Test", sub: "seed-script" };

const clients: Omit<ClientMetadata, "id">[] = [
  {
    dateOfBirth: "1948-03-22",
    endDate: "open",
    details: {
      customId: "",
      name: "Edith Warburton",
      address: {
        streetAddress: "3 Meadow Lane",
        locality: "Wiveliscombe",
        county: "Somerset",
        postCode: "TA4 2JX",
        deprivation: { income: false, health: false },
      },
      phone: "07700 900111",
      email: "edith.warburton@example.com",
      nextOfKin: "David Warburton (son) - 07700 900222",
      attendsMag: true,
      notes: [
        {
          date: "2026-01-10",
          note: "Weekly domestic support arranged.",
          source: "Phone",
          minutesTaken: 15,
        },
      ],
      services: ["Domestic", "Companionship"],
      donationScheme: true,
      donationAmount: 10,
      referredBy: "GP Surgery",
      clientAgreementDate: "2026-01-05",
      clientAgreementComments: "All terms agreed.",
      riskAssessmentDate: "2026-01-05",
      riskAssessmentComments: "Low risk.",
      attendanceAllowance: {
        requestedLevel: "None",
        hoursToCompleteRequest: 0,
        completedBy: { id: "", name: "" },
        requestedDate: "",
        status: "None",
        confirmationDate: "",
      },
      endReason: "None",
    },
    requests: [],
  },
  {
    dateOfBirth: "1955-09-08",
    endDate: "open",
    details: {
      customId: "",
      name: "Arthur Pengelly",
      address: {
        streetAddress: "Orchard House, Fore Street",
        locality: "Milverton",
        county: "Somerset",
        postCode: "TA4 1JU",
        deprivation: { income: false, health: false },
      },
      phone: "07700 900555",
      email: "arthur.pengelly@example.com",
      nextOfKin: "Margaret Pengelly (wife) - 07700 900556",
      attendsMag: false,
      notes: [],
      services: ["Personal Care", "Transport"],
      donationScheme: false,
      donationAmount: 0,
      referredBy: "Social Services",
      clientAgreementDate: "2025-11-20",
      clientAgreementComments: "",
      riskAssessmentDate: "2025-11-20",
      riskAssessmentComments: "Mobility aids in use.",
      attendanceAllowance: {
        requestedLevel: "High",
        hoursToCompleteRequest: 2,
        completedBy: { id: "", name: "" },
        requestedDate: "2025-12-01",
        status: "Pending",
        confirmationDate: "",
      },
      endReason: "None",
    },
    requests: [],
  },
  {
    dateOfBirth: "1962-01-30",
    endDate: "open",
    details: {
      customId: "",
      name: "Nancy Trembath",
      address: {
        streetAddress: "5 Blacksmith's Row",
        locality: "Halse",
        county: "Somerset",
        postCode: "TA4 3AB",
        deprivation: { income: false, health: false },
      },
      phone: "07700 900777",
      email: "nancy.trembath@example.com",
      nextOfKin: "Susan Trembath (daughter)",
      attendsMag: true,
      notes: [
        {
          date: "2026-02-14",
          note: "Attends the Memory Activity Group fortnightly.",
          source: "In Person",
          minutesTaken: 5,
        },
      ],
      services: ["Companionship", "MAG"],
      donationScheme: true,
      donationAmount: 5,
      referredBy: "Self",
      clientAgreementDate: "2026-02-01",
      clientAgreementComments: "",
      riskAssessmentDate: "2026-02-01",
      riskAssessmentComments: "",
      attendanceAllowance: {
        requestedLevel: "None",
        hoursToCompleteRequest: 0,
        completedBy: { id: "", name: "" },
        requestedDate: "",
        status: "None",
        confirmationDate: "",
      },
      endReason: "None",
    },
    requests: [],
  },
];

const volunteers: Omit<VolunteerMetadata, "id">[] = [
  {
    dateOfBirth: "1979-06-14",
    endDate: "open",
    dbsExpiry: "2027-03-31",
    publicLiabilityExpiry: "2027-03-31",
    trainingRecords: [],
    details: {
      name: "Sarah Johnson",
      address: {
        streetAddress: "12 Church Street",
        locality: "Milverton",
        county: "Somerset",
        postCode: "TA4 1JU",
      },
      phone: "07700 900333",
      email: "sarah.johnson@example.com",
      nextOfKin: "Michael Johnson (husband)",
      attendsMag: true,
      notes: [],
      dbsNumber: "",
      publicLiabilityNumber: "",
      startDate: "2025-09-01",
      role: "Volunteer",
    },
    packages: [],
  },
  {
    dateOfBirth: "1990-12-03",
    endDate: "open",
    dbsExpiry: "2026-10-31",
    publicLiabilityExpiry: "2026-10-31",
    trainingRecords: [],
    details: {
      name: "Tom Ellery",
      address: {
        streetAddress: "Hillside, Waterrow",
        locality: "Waterrow",
        county: "Somerset",
        postCode: "TA4 2AX",
      },
      phone: "07700 900888",
      email: "tom.ellery@example.com",
      nextOfKin: "Claire Ellery (sister)",
      attendsMag: false,
      notes: [],
      dbsNumber: "",
      publicLiabilityNumber: "",
      startDate: "2026-01-15",
      role: "Volunteer",
    },
    packages: [],
  },
];

const mps: Omit<MpMetadata, "id">[] = [
  {
    dateOfBirth: "1985-11-02",
    endDate: "open",
    dbsExpiry: "2027-01-31",
    publicLiabilityExpiry: "2027-01-31",
    feePaymentDate: "2026-04-01",
    trainingRecords: [],
    details: {
      name: "James Fletcher",
      address: {
        streetAddress: "Rose Cottage, High Street",
        locality: "Halse",
        county: "Somerset",
        postCode: "TA4 3AB",
      },
      phone: "07700 900444",
      email: "james.fletcher@example.com",
      nextOfKin: "Anna Fletcher (wife)",
      attendsMag: false,
      notes: [],
      dbsNumber: "",
      publicLiabilityNumber: "",
      startDate: "2024-05-01",
    },
    packages: [],
  },
  {
    dateOfBirth: "1972-07-19",
    endDate: "open",
    dbsExpiry: "2026-08-31",
    publicLiabilityExpiry: "2026-08-31",
    feePaymentDate: "unpaid",
    trainingRecords: [],
    details: {
      name: "Priya Anand",
      address: {
        streetAddress: "2 Riverside Terrace",
        locality: "Wiveliscombe",
        county: "Somerset",
        postCode: "TA4 2NB",
      },
      phone: "07700 900999",
      email: "priya.anand@example.com",
      nextOfKin: "Raj Anand (husband)",
      attendsMag: true,
      notes: [
        {
          date: "2025-10-05",
          note: "Provides personal care and meal prep locally.",
          source: "Email",
          minutesTaken: 0,
        },
      ],
      dbsNumber: "",
      publicLiabilityNumber: "",
      startDate: "2023-02-01",
    },
    packages: [],
  },
];

// Every table the seed may ever write to — prod's WiveyCares2 must never be
// listed. Anything unrecognised (typo, new env) is refused, not defaulted.
const SEEDABLE_TABLES = ["Test2", "Test2-Staging", "WiveyCares2-Staging"];

export async function runSeed() {
  const table = getTableName(seedUser);
  if (!SEEDABLE_TABLES.includes(table)) {
    throw new Error(
      `Refusing to seed: resolved table "${table}" is not a known non-production table.`
    );
  }

  const usingAws = process.env.NODE_ENV === "production";
  console.log(
    `🌱 Seeding "${table}" via ${
      usingAws ? "AWS DynamoDB" : "LOCAL DynamoDB (localhost:8000)"
    }...\n`
  );

  const services = createServices();

  for (const client of clients) {
    const { clientId } = await services.client.create(client, seedUser);
    console.log(`  • client   ${client.details.name} → ${clientId}`);
  }
  for (const volunteer of volunteers) {
    const id = await services.volunteer.create(volunteer, seedUser);
    console.log(`  • volunteer ${volunteer.details.name} → ${id}`);
  }
  for (const mp of mps) {
    const id = await services.mp.create(mp, seedUser);
    console.log(`  • MP        ${mp.details.name} → ${id}`);
  }

  console.log(
    `\n✅ Seed complete: ${clients.length} clients, ${volunteers.length} volunteers, ${mps.length} MPs written to ${table}.`
  );
}
