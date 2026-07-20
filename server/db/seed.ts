import {
  ClientMetadata,
  MpMetadata,
  VolunteerMetadata,
  RequestMetadata,
  ReqPackage,
} from "shared";
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
//
// The data below is shaped to light up every *live* tab of the analytics
// Dashboard (client/src/pages/Dashboard.tsx):
//   • Overview counters      ← active requests + active packages (endDate "open")
//   • Requests/Packages tabs ← per-request/package locality, deprivation, service
//   • Attendance Allowance   ← per-client attendanceAllowance status/level/dates
//
// Requests and packages are stored as their own DynamoDB items (keyed by
// clientId / carerId), so they can't be nested on the client object — they must
// be created *after* their owner via services.requests.create /
// services.packages.create, wiring in the ids returned from earlier creates.
// Ordering is therefore: carers → clients → requests → packages.
const seedUser: User = { role: "Test", sub: "seed-script" };

// Attendance-allowance "this month" tiles compare requestedDate/confirmationDate
// against the real current month at query time, so we generate those dates
// dynamically (mid-month days stay in-month under any timezone offset).
const now = new Date();
const isoDay = (day: number) =>
  new Date(now.getFullYear(), now.getMonth(), day).toISOString().slice(0, 10);
const thisMonthRequested = isoDay(8);
const thisMonthConfirmed = isoDay(14);

// All active requests/packages are dated within the current calendar year: the
// requests report defaults startYear to the current year and throws if an open
// item starts in an earlier year (server/db/analytics/normal/service.ts).
const YEAR = now.getFullYear();
const d = (monthDay: string) => `${YEAR}-${monthDay}`;

type Locality = ClientMetadata["details"]["address"]["locality"];
type Deprivation = { income: boolean; health: boolean };

// Address helper for the deprivation-bearing addresses on clients, requests and
// packages. Deprivation is read verbatim by the analytics deprivation
// cross-sections, so it's set explicitly here (client-record deprivation is
// separately overwritten by a postcode lookup, but that doesn't feed the tabs).
const addr = (
  streetAddress: string,
  locality: Locality,
  postCode: string,
  deprivation: Deprivation
) => ({ streetAddress, locality, county: "Somerset", postCode, deprivation });

const noAA: ClientMetadata["details"]["attendanceAllowance"] = {
  requestedLevel: "None",
  hoursToCompleteRequest: 0,
  completedBy: { id: "", name: "" },
  requestedDate: "",
  status: "None",
  confirmationDate: "",
};

// ---------------------------------------------------------------------------
// Carers (volunteers + MPs). Created first so their ids can be used as package
// carerIds and, for the coordinator, as attendanceAllowance.completedBy.
// ---------------------------------------------------------------------------
type CarerSeed =
  | { key: string; kind: "volunteer"; data: Omit<VolunteerMetadata, "id"> }
  | { key: string; kind: "mp"; data: Omit<MpMetadata, "id"> };

const carers: CarerSeed[] = [
  {
    key: "sarah",
    kind: "volunteer",
    data: {
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
        startDate: "2024-04-01",
        role: "Coordinator",
      },
      packages: [],
    },
  },
  {
    key: "tom",
    kind: "volunteer",
    data: {
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
  },
  {
    key: "grace",
    kind: "volunteer",
    data: {
      dateOfBirth: "1983-04-27",
      endDate: "open",
      dbsExpiry: "2027-05-31",
      publicLiabilityExpiry: "2027-05-31",
      trainingRecords: [],
      details: {
        name: "Grace Aplin",
        address: {
          streetAddress: "7 Croft Way",
          locality: "Wiveliscombe",
          county: "Somerset",
          postCode: "TA4 2JX",
        },
        phone: "07700 901222",
        email: "grace.aplin@example.com",
        nextOfKin: "Peter Aplin (husband)",
        attendsMag: false,
        notes: [],
        dbsNumber: "",
        publicLiabilityNumber: "",
        startDate: "2025-06-01",
        role: "Volunteer",
      },
      packages: [],
    },
  },
  {
    key: "daniel",
    kind: "volunteer",
    data: {
      dateOfBirth: "1975-09-11",
      endDate: "open",
      dbsExpiry: "2026-12-31",
      publicLiabilityExpiry: "2026-12-31",
      trainingRecords: [],
      details: {
        name: "Daniel Roue",
        address: {
          streetAddress: "Glebe Farm",
          locality: "Ashbrittle",
          county: "Somerset",
          postCode: "TA21 0HZ",
        },
        phone: "07700 901333",
        email: "daniel.roue@example.com",
        nextOfKin: "Helen Roue (wife)",
        attendsMag: false,
        notes: [],
        dbsNumber: "",
        publicLiabilityNumber: "",
        startDate: "2024-11-01",
        role: "Volunteer",
      },
      packages: [],
    },
  },
  {
    key: "olivia",
    kind: "volunteer",
    data: {
      dateOfBirth: "1998-02-19",
      endDate: "open",
      dbsExpiry: "2027-08-31",
      publicLiabilityExpiry: "2027-08-31",
      trainingRecords: [],
      details: {
        name: "Olivia Camp",
        address: {
          streetAddress: "4 School Lane",
          locality: "Halse",
          county: "Somerset",
          postCode: "TA4 3AB",
        },
        phone: "07700 901444",
        email: "olivia.camp@example.com",
        nextOfKin: "Rachel Camp (mother)",
        attendsMag: true,
        notes: [],
        dbsNumber: "",
        publicLiabilityNumber: "",
        startDate: "2026-03-01",
        role: "Volunteer",
      },
      packages: [],
    },
  },
  {
    key: "james",
    kind: "mp",
    data: {
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
  },
  {
    key: "priya",
    kind: "mp",
    data: {
      dateOfBirth: "1972-07-19",
      endDate: "open",
      dbsExpiry: "2026-08-31",
      publicLiabilityExpiry: "2026-08-31",
      feePaymentDate: "2026-04-01",
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
        notes: [],
        dbsNumber: "",
        publicLiabilityNumber: "",
        startDate: "2023-02-01",
      },
      packages: [],
    },
  },
  {
    key: "marcus",
    kind: "mp",
    data: {
      dateOfBirth: "1968-03-30",
      endDate: "open",
      dbsExpiry: "2027-02-28",
      publicLiabilityExpiry: "2027-02-28",
      feePaymentDate: "2026-04-01",
      trainingRecords: [],
      details: {
        name: "Marcus Webb",
        address: {
          streetAddress: "9 Sellicks Green",
          locality: "Milverton",
          county: "Somerset",
          postCode: "TA4 1LX",
        },
        phone: "07700 901555",
        email: "marcus.webb@example.com",
        nextOfKin: "Diane Webb (wife)",
        attendsMag: false,
        notes: [],
        dbsNumber: "",
        publicLiabilityNumber: "",
        startDate: "2022-09-01",
      },
      packages: [],
    },
  },
  {
    key: "lucy",
    kind: "mp",
    data: {
      dateOfBirth: "1991-08-08",
      endDate: "open",
      dbsExpiry: "2026-11-30",
      publicLiabilityExpiry: "2026-11-30",
      feePaymentDate: "unpaid",
      trainingRecords: [],
      details: {
        name: "Lucy Hartnell",
        address: {
          streetAddress: "Beech View",
          locality: "Upton",
          county: "Somerset",
          postCode: "TA4 2DA",
        },
        phone: "07700 901666",
        email: "lucy.hartnell@example.com",
        nextOfKin: "Mark Hartnell (husband)",
        attendsMag: false,
        notes: [],
        dbsNumber: "",
        publicLiabilityNumber: "",
        startDate: "2025-01-10",
      },
      packages: [],
    },
  },
];

// ---------------------------------------------------------------------------
// Clients. A function so the two coordinator-completed AA clients can reference
// the coordinator's created id. Attendance-allowance states are spread so every
// tile on the Attendance Allowance tab is non-zero.
// ---------------------------------------------------------------------------
type ClientSeed = { key: string; data: Omit<ClientMetadata, "id"> };

function buildClients(coordinatorId: string): ClientSeed[] {
  const coordinator = { id: coordinatorId, name: "Sarah Johnson" };
  return [
    {
      // Receiving High, requested High, confirmed this month → drives the
      // receiving-high, %-tiles and every This-Month tile.
      key: "edith",
      data: {
        dateOfBirth: "1948-03-22",
        endDate: "open",
        details: {
          customId: "",
          name: "Edith Warburton",
          address: addr("3 Meadow Lane", "Wiveliscombe", "TA4 2JX", {
            income: true,
            health: false,
          }),
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
          services: ["Domestic", "Companionship", "Attendance Allowance"],
          donationScheme: true,
          donationAmount: 10,
          referredBy: "GP Surgery",
          clientAgreementDate: "2026-01-05",
          clientAgreementComments: "All terms agreed.",
          riskAssessmentDate: "2026-01-05",
          riskAssessmentComments: "Low risk.",
          attendanceAllowance: {
            requestedLevel: "High",
            hoursToCompleteRequest: 3,
            completedBy: coordinator,
            requestedDate: thisMonthRequested,
            status: "High",
            confirmationDate: thisMonthConfirmed,
          },
          endReason: "None",
        },
        requests: [],
      },
    },
    {
      // Receiving Low, confirmed this month.
      key: "arthur",
      data: {
        dateOfBirth: "1955-09-08",
        endDate: "open",
        details: {
          customId: "",
          name: "Arthur Pengelly",
          address: addr("Orchard House, Fore Street", "Milverton", "TA4 1JU", {
            income: false,
            health: true,
          }),
          phone: "07700 900555",
          email: "arthur.pengelly@example.com",
          nextOfKin: "Margaret Pengelly (wife) - 07700 900556",
          attendsMag: false,
          notes: [],
          services: ["Personal Care", "Transport", "Attendance Allowance"],
          donationScheme: false,
          donationAmount: 0,
          referredBy: "Social Services",
          clientAgreementDate: "2025-11-20",
          clientAgreementComments: "",
          riskAssessmentDate: "2025-11-20",
          riskAssessmentComments: "Mobility aids in use.",
          attendanceAllowance: {
            requestedLevel: "Low",
            hoursToCompleteRequest: 2,
            completedBy: coordinator,
            requestedDate: thisMonthRequested,
            status: "Low",
            confirmationDate: thisMonthConfirmed,
          },
          endReason: "None",
        },
        requests: [],
      },
    },
    {
      // Pending a High request submitted this month, not yet confirmed.
      key: "nancy",
      data: {
        dateOfBirth: "1962-01-30",
        endDate: "open",
        details: {
          customId: "",
          name: "Nancy Trembath",
          address: addr("5 Blacksmith's Row", "Halse", "TA4 3AB", {
            income: true,
            health: true,
          }),
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
          services: ["Companionship", "Sitting Service", "Attendance Allowance"],
          donationScheme: true,
          donationAmount: 5,
          referredBy: "Self",
          clientAgreementDate: "2026-02-01",
          clientAgreementComments: "",
          riskAssessmentDate: "2026-02-01",
          riskAssessmentComments: "",
          attendanceAllowance: {
            requestedLevel: "High",
            hoursToCompleteRequest: 2,
            completedBy: { id: "", name: "" },
            requestedDate: thisMonthRequested,
            status: "Pending",
            confirmationDate: "",
          },
          endReason: "None",
        },
        requests: [],
      },
    },
    {
      // Form completed but Unsent (does not count as "requested").
      key: "walter",
      data: {
        dateOfBirth: "1944-05-17",
        endDate: "open",
        details: {
          customId: "",
          name: "Walter Coombes",
          address: addr("Brook Cottage", "Waterrow", "TA4 2AX", {
            income: false,
            health: false,
          }),
          phone: "07700 901777",
          email: "walter.coombes@example.com",
          nextOfKin: "Janet Coombes (daughter)",
          attendsMag: false,
          notes: [],
          services: ["Meal Prep", "Med Prompt"],
          donationScheme: false,
          donationAmount: 0,
          referredBy: "District Nurse",
          clientAgreementDate: "2026-03-01",
          clientAgreementComments: "",
          riskAssessmentDate: "2026-03-01",
          riskAssessmentComments: "",
          attendanceAllowance: {
            requestedLevel: "Low",
            hoursToCompleteRequest: 0,
            completedBy: { id: "", name: "" },
            requestedDate: thisMonthRequested,
            status: "Unsent",
            confirmationDate: "",
          },
          endReason: "None",
        },
        requests: [],
      },
    },
    {
      key: "doris",
      data: {
        dateOfBirth: "1951-10-02",
        endDate: "open",
        details: {
          customId: "",
          name: "Doris Setter",
          address: addr("2 Chapel Row", "Huish Champflower", "TA4 2EX", {
            income: true,
            health: false,
          }),
          phone: "07700 901888",
          email: "doris.setter@example.com",
          nextOfKin: "Brian Setter (son)",
          attendsMag: false,
          notes: [],
          services: ["Personal Care"],
          donationScheme: true,
          donationAmount: 8,
          referredBy: "GP Surgery",
          clientAgreementDate: "2026-03-10",
          clientAgreementComments: "",
          riskAssessmentDate: "2026-03-10",
          riskAssessmentComments: "",
          attendanceAllowance: noAA,
          endReason: "None",
        },
        requests: [],
      },
    },
    {
      key: "reginald",
      data: {
        dateOfBirth: "1939-12-25",
        endDate: "open",
        details: {
          customId: "",
          name: "Reginald Hoskins",
          address: addr("Fern Bank", "Chipstable", "TA4 2PY", {
            income: false,
            health: true,
          }),
          phone: "07700 901999",
          email: "reginald.hoskins@example.com",
          nextOfKin: "Pauline Hoskins (wife)",
          attendsMag: false,
          notes: [],
          services: ["Domestic"],
          donationScheme: false,
          donationAmount: 0,
          referredBy: "Self",
          clientAgreementDate: "2026-04-01",
          clientAgreementComments: "",
          riskAssessmentDate: "2026-04-01",
          riskAssessmentComments: "",
          attendanceAllowance: noAA,
          endReason: "None",
        },
        requests: [],
      },
    },
    {
      // Receiving Low, confirmed earlier this year (counts overall, not This-Month).
      key: "mabel",
      data: {
        dateOfBirth: "1946-06-11",
        endDate: "open",
        details: {
          customId: "",
          name: "Mabel Tucker",
          address: addr("14 Springfield", "Upton", "TA4 2DA", {
            income: true,
            health: true,
          }),
          phone: "07700 902111",
          email: "mabel.tucker@example.com",
          nextOfKin: "Ian Tucker (son)",
          attendsMag: false,
          notes: [],
          services: ["Companionship", "Blue Badge", "Attendance Allowance"],
          donationScheme: true,
          donationAmount: 5,
          referredBy: "Social Services",
          clientAgreementDate: "2026-04-15",
          clientAgreementComments: "",
          riskAssessmentDate: "2026-04-15",
          riskAssessmentComments: "",
          attendanceAllowance: {
            requestedLevel: "Low",
            hoursToCompleteRequest: 2,
            completedBy: coordinator,
            requestedDate: d("03-01"),
            status: "Low",
            confirmationDate: d("03-20"),
          },
          endReason: "None",
        },
        requests: [],
      },
    },
    {
      key: "frederick",
      data: {
        dateOfBirth: "1937-02-08",
        endDate: "open",
        details: {
          customId: "",
          name: "Frederick Norman",
          address: addr("Willow End", "Ashbrittle", "TA21 0HZ", {
            income: false,
            health: false,
          }),
          phone: "07700 902222",
          email: "frederick.norman@example.com",
          nextOfKin: "Carol Norman (daughter)",
          attendsMag: false,
          notes: [],
          services: ["Overnight"],
          donationScheme: false,
          donationAmount: 0,
          referredBy: "Hospital Discharge",
          clientAgreementDate: "2026-05-01",
          clientAgreementComments: "",
          riskAssessmentDate: "2026-05-01",
          riskAssessmentComments: "Overnight sitting cover in place.",
          attendanceAllowance: noAA,
          endReason: "None",
        },
        requests: [],
      },
    },
    {
      // Pending a Low request submitted earlier this year.
      key: "beatrice",
      data: {
        dateOfBirth: "1959-07-23",
        endDate: "open",
        details: {
          customId: "",
          name: "Beatrice Cornish",
          address: addr("6 Millbrook", "Stawley", "TA21 0HR", {
            income: true,
            health: false,
          }),
          phone: "07700 902333",
          email: "beatrice.cornish@example.com",
          nextOfKin: "Gary Cornish (son)",
          attendsMag: false,
          notes: [],
          services: ["Transport", "Companionship"],
          donationScheme: true,
          donationAmount: 3,
          referredBy: "Self",
          clientAgreementDate: "2026-05-10",
          clientAgreementComments: "",
          riskAssessmentDate: "2026-05-10",
          riskAssessmentComments: "",
          attendanceAllowance: {
            requestedLevel: "Low",
            hoursToCompleteRequest: 0,
            completedBy: { id: "", name: "" },
            requestedDate: d("05-10"),
            status: "Pending",
            confirmationDate: "",
          },
          endReason: "None",
        },
        requests: [],
      },
    },
    {
      key: "harold",
      data: {
        dateOfBirth: "1943-11-04",
        endDate: "open",
        details: {
          customId: "",
          name: "Harold Vickery",
          address: addr("Yew Tree House", "Fitzhead", "TA4 3JP", {
            income: false,
            health: true,
          }),
          phone: "07700 902444",
          email: "harold.vickery@example.com",
          nextOfKin: "Sheila Vickery (wife)",
          attendsMag: false,
          notes: [],
          services: ["Med Prompt"],
          donationScheme: false,
          donationAmount: 0,
          referredBy: "GP Surgery",
          clientAgreementDate: "2026-06-01",
          clientAgreementComments: "",
          riskAssessmentDate: "2026-06-01",
          riskAssessmentComments: "",
          attendanceAllowance: noAA,
          endReason: "None",
        },
        requests: [],
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// Requests (one care request per client, all active/open, dated this year).
// clientKey resolves to the created clientId at run time. These drive the
// Overview requested-hours counter and the Requests Breakdown tab.
// ---------------------------------------------------------------------------
type RequestSeed = {
  key: string;
  clientKey: string;
  data: Omit<RequestMetadata, "id" | "clientId">;
};

const requestDefs: RequestSeed[] = [
  {
    key: "r-edith",
    clientKey: "edith",
    data: {
      requestType: "paid",
      startDate: d("01-15"),
      endDate: "open",
      details: {
        customId: "",
        name: "Edith Warburton",
        weeklyHours: 4,
        oneOffStartDateHours: 0,
        address: addr("3 Meadow Lane", "Wiveliscombe", "TA4 2JX", {
          income: true,
          health: false,
        }),
        status: "normal",
        services: ["Domestic", "Companionship"],
        notes: "Weekly domestic support.",
      },
    },
  },
  {
    key: "r-arthur",
    clientKey: "arthur",
    data: {
      requestType: "paid",
      startDate: d("02-02"),
      endDate: "open",
      details: {
        customId: "",
        name: "Arthur Pengelly",
        weeklyHours: 6,
        oneOffStartDateHours: 0,
        address: addr("Orchard House, Fore Street", "Milverton", "TA4 1JU", {
          income: false,
          health: true,
        }),
        status: "normal",
        services: ["Personal Care", "Transport"],
        notes: "",
      },
    },
  },
  {
    key: "r-nancy",
    clientKey: "nancy",
    data: {
      requestType: "unpaid",
      startDate: d("02-14"),
      endDate: "open",
      details: {
        customId: "",
        name: "Nancy Trembath",
        weeklyHours: 3,
        oneOffStartDateHours: 0,
        address: addr("5 Blacksmith's Row", "Halse", "TA4 3AB", {
          income: true,
          health: true,
        }),
        status: "normal",
        services: ["Companionship", "Sitting Service"],
        notes: "",
      },
    },
  },
  {
    key: "r-walter",
    clientKey: "walter",
    data: {
      requestType: "paid",
      startDate: d("03-03"),
      endDate: "open",
      details: {
        customId: "",
        name: "Walter Coombes",
        weeklyHours: 5,
        oneOffStartDateHours: 0,
        address: addr("Brook Cottage", "Waterrow", "TA4 2AX", {
          income: false,
          health: false,
        }),
        status: "urgent",
        services: ["Meal Prep", "Med Prompt"],
        notes: "",
      },
    },
  },
  {
    key: "r-doris",
    clientKey: "doris",
    data: {
      requestType: "paid",
      startDate: d("03-20"),
      endDate: "open",
      details: {
        customId: "",
        name: "Doris Setter",
        weeklyHours: 7,
        oneOffStartDateHours: 0,
        address: addr("2 Chapel Row", "Huish Champflower", "TA4 2EX", {
          income: true,
          health: false,
        }),
        status: "normal",
        services: ["Personal Care"],
        notes: "",
      },
    },
  },
  {
    key: "r-reginald",
    clientKey: "reginald",
    data: {
      requestType: "unpaid",
      startDate: d("04-05"),
      endDate: "open",
      details: {
        customId: "",
        name: "Reginald Hoskins",
        weeklyHours: 2,
        oneOffStartDateHours: 0,
        address: addr("Fern Bank", "Chipstable", "TA4 2PY", {
          income: false,
          health: true,
        }),
        status: "normal",
        services: ["Domestic"],
        notes: "",
      },
    },
  },
  {
    key: "r-mabel",
    clientKey: "mabel",
    data: {
      requestType: "paid",
      startDate: d("04-18"),
      endDate: "open",
      details: {
        customId: "",
        name: "Mabel Tucker",
        weeklyHours: 4,
        oneOffStartDateHours: 0,
        address: addr("14 Springfield", "Upton", "TA4 2DA", {
          income: true,
          health: true,
        }),
        status: "normal",
        services: ["Companionship", "Blue Badge"],
        notes: "",
      },
    },
  },
  {
    key: "r-frederick",
    clientKey: "frederick",
    data: {
      requestType: "paid",
      startDate: d("05-02"),
      endDate: "open",
      details: {
        customId: "",
        name: "Frederick Norman",
        weeklyHours: 10,
        oneOffStartDateHours: 0,
        address: addr("Willow End", "Ashbrittle", "TA21 0HZ", {
          income: false,
          health: false,
        }),
        status: "normal",
        services: ["Overnight"],
        notes: "",
      },
    },
  },
  {
    key: "r-beatrice",
    clientKey: "beatrice",
    data: {
      requestType: "unpaid",
      startDate: d("05-15"),
      endDate: "open",
      details: {
        customId: "",
        name: "Beatrice Cornish",
        weeklyHours: 3,
        oneOffStartDateHours: 0,
        address: addr("6 Millbrook", "Stawley", "TA21 0HR", {
          income: true,
          health: false,
        }),
        status: "normal",
        services: ["Transport", "Companionship"],
        notes: "",
      },
    },
  },
  {
    key: "r-harold",
    clientKey: "harold",
    data: {
      requestType: "paid",
      startDate: d("06-01"),
      endDate: "open",
      details: {
        customId: "",
        name: "Harold Vickery",
        weeklyHours: 2,
        oneOffStartDateHours: 0,
        address: addr("Yew Tree House", "Fitzhead", "TA4 3JP", {
          income: false,
          health: true,
        }),
        status: "normal",
        services: ["Med Prompt"],
        notes: "",
      },
    },
  },
  {
    // Information-only request: correctly excluded from the without-info
    // Overview counter and Requests/Packages breakdowns.
    key: "r-edith-info",
    clientKey: "edith",
    data: {
      requestType: "unpaid",
      startDate: d("06-10"),
      endDate: "open",
      details: {
        customId: "",
        name: "Edith Warburton",
        weeklyHours: 1,
        oneOffStartDateHours: 0,
        address: addr("3 Meadow Lane", "Wiveliscombe", "TA4 2JX", {
          income: true,
          health: false,
        }),
        status: "normal",
        services: ["Information"],
        notes: "Signposting only.",
      },
    },
  },
  {
    key: "r-arthur-2",
    clientKey: "arthur",
    data: {
      requestType: "paid",
      startDate: d("07-01"),
      endDate: "open",
      details: {
        customId: "",
        name: "Arthur Pengelly",
        weeklyHours: 5,
        oneOffStartDateHours: 0,
        address: addr("Orchard House, Fore Street", "Milverton", "TA4 1JU", {
          income: false,
          health: true,
        }),
        status: "normal",
        services: ["Sitting Service", "Companionship"],
        notes: "",
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Packages (brokered cover for a request, owned by a carer). requestKey →
// requestId, carerKey → carerId at run time. A few requests are deliberately
// left unbrokered so requested hours exceed brokered hours. These drive the
// Overview brokered-hours counter and the Packages Breakdown tab.
// ---------------------------------------------------------------------------
type PackageSeed = {
  requestKey: string;
  carerKey: string;
  data: Omit<ReqPackage, "id" | "carerId" | "requestId">;
};

const packageDefs: PackageSeed[] = [
  {
    requestKey: "r-edith",
    carerKey: "sarah",
    data: {
      startDate: d("01-20"),
      endDate: "open",
      details: {
        name: "Sarah Johnson",
        weeklyHours: 4,
        oneOffStartDateHours: 0,
        address: addr("3 Meadow Lane", "Wiveliscombe", "TA4 2JX", {
          income: true,
          health: false,
        }),
        notes: "",
        services: ["Domestic", "Companionship"],
      },
    },
  },
  {
    requestKey: "r-arthur",
    carerKey: "james",
    data: {
      startDate: d("02-05"),
      endDate: "open",
      details: {
        name: "James Fletcher",
        weeklyHours: 6,
        oneOffStartDateHours: 0,
        address: addr("Orchard House, Fore Street", "Milverton", "TA4 1JU", {
          income: false,
          health: true,
        }),
        notes: "",
        services: ["Personal Care", "Transport"],
      },
    },
  },
  {
    requestKey: "r-nancy",
    carerKey: "tom",
    data: {
      startDate: d("02-18"),
      endDate: "open",
      details: {
        name: "Tom Ellery",
        weeklyHours: 3,
        oneOffStartDateHours: 0,
        address: addr("5 Blacksmith's Row", "Halse", "TA4 3AB", {
          income: true,
          health: true,
        }),
        notes: "",
        services: ["Companionship", "Sitting Service"],
      },
    },
  },
  {
    requestKey: "r-walter",
    carerKey: "priya",
    data: {
      startDate: d("03-06"),
      endDate: "open",
      details: {
        name: "Priya Anand",
        weeklyHours: 5,
        oneOffStartDateHours: 0,
        address: addr("Brook Cottage", "Waterrow", "TA4 2AX", {
          income: false,
          health: false,
        }),
        notes: "",
        services: ["Meal Prep", "Med Prompt"],
      },
    },
  },
  {
    requestKey: "r-doris",
    carerKey: "grace",
    data: {
      startDate: d("03-24"),
      endDate: "open",
      details: {
        name: "Grace Aplin",
        weeklyHours: 7,
        oneOffStartDateHours: 0,
        address: addr("2 Chapel Row", "Huish Champflower", "TA4 2EX", {
          income: true,
          health: false,
        }),
        notes: "",
        services: ["Personal Care"],
      },
    },
  },
  {
    requestKey: "r-mabel",
    carerKey: "marcus",
    data: {
      startDate: d("04-22"),
      endDate: "open",
      details: {
        name: "Marcus Webb",
        weeklyHours: 4,
        oneOffStartDateHours: 0,
        address: addr("14 Springfield", "Upton", "TA4 2DA", {
          income: true,
          health: true,
        }),
        notes: "",
        services: ["Companionship", "Blue Badge"],
      },
    },
  },
  {
    requestKey: "r-frederick",
    carerKey: "daniel",
    data: {
      startDate: d("05-06"),
      endDate: "open",
      details: {
        name: "Daniel Roue",
        weeklyHours: 10,
        oneOffStartDateHours: 0,
        address: addr("Willow End", "Ashbrittle", "TA21 0HZ", {
          income: false,
          health: false,
        }),
        notes: "",
        services: ["Overnight"],
      },
    },
  },
  {
    requestKey: "r-harold",
    carerKey: "lucy",
    data: {
      startDate: d("06-04"),
      endDate: "open",
      details: {
        name: "Lucy Hartnell",
        weeklyHours: 2,
        oneOffStartDateHours: 0,
        address: addr("Yew Tree House", "Fitzhead", "TA4 3JP", {
          income: false,
          health: true,
        }),
        notes: "",
        services: ["Med Prompt"],
      },
    },
  },
  {
    requestKey: "r-arthur-2",
    carerKey: "sarah",
    data: {
      startDate: d("07-05"),
      endDate: "open",
      details: {
        name: "Sarah Johnson",
        weeklyHours: 5,
        oneOffStartDateHours: 0,
        address: addr("Orchard House, Fore Street", "Milverton", "TA4 1JU", {
          income: false,
          health: true,
        }),
        notes: "",
        services: ["Sitting Service", "Companionship"],
      },
    },
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

  // 1. Carers first — their ids become package carerIds and the coordinator id.
  const carerIds = new Map<string, string>();
  for (const carer of carers) {
    const id =
      carer.kind === "volunteer"
        ? await services.volunteer.create(carer.data, seedUser)
        : await services.mp.create(carer.data, seedUser);
    carerIds.set(carer.key, id);
    console.log(
      `  • ${carer.kind === "volunteer" ? "volunteer" : "MP       "} ${
        carer.data.details.name
      } → ${id}`
    );
  }

  const coordinatorId = carerIds.get("sarah");
  if (!coordinatorId) {
    throw new Error("Coordinator volunteer 'sarah' was not created.");
  }

  // 2. Clients (AA.completedBy can now reference the coordinator).
  const clientIds = new Map<string, string>();
  for (const client of buildClients(coordinatorId)) {
    const { clientId } = await services.client.create(client.data, seedUser);
    clientIds.set(client.key, clientId);
    console.log(`  • client    ${client.data.details.name} → ${clientId}`);
  }

  // 3. Requests (need clientId).
  const requestIds = new Map<string, string>();
  for (const request of requestDefs) {
    const clientId = clientIds.get(request.clientKey);
    if (!clientId) {
      throw new Error(
        `Unknown clientKey "${request.clientKey}" for request "${request.key}".`
      );
    }
    const requestId = await services.requests.create(
      { clientId, ...request.data },
      seedUser
    );
    requestIds.set(request.key, requestId);
    console.log(
      `  • request   ${request.data.details.name} [${request.data.details.services.join(
        ", "
      )}] → ${requestId}`
    );
  }

  // 4. Packages (need carerId + requestId).
  let packageCount = 0;
  for (const pkg of packageDefs) {
    const carerId = carerIds.get(pkg.carerKey);
    const requestId = requestIds.get(pkg.requestKey);
    if (!carerId) {
      throw new Error(`Unknown carerKey "${pkg.carerKey}" for a package.`);
    }
    if (!requestId) {
      throw new Error(`Unknown requestKey "${pkg.requestKey}" for a package.`);
    }
    const packageId = await services.packages.create(
      { carerId, requestId, ...pkg.data },
      seedUser
    );
    packageCount++;
    console.log(`  • package   ${pkg.data.details.name} → ${packageId}`);
  }

  const carerCount = carers.length;
  const volunteerCount = carers.filter((c) => c.kind === "volunteer").length;
  const mpCount = carerCount - volunteerCount;
  console.log(
    `\n✅ Seed complete: ${clientIds.size} clients, ${volunteerCount} volunteers, ${mpCount} MPs, ${requestIds.size} requests, ${packageCount} packages written to ${table}.`
  );
}
