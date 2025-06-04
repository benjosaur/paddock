import type {
  MpLog,
  VolunteerLog,
  MagLog,
  Client,
  ClientRequest,
  Mp,
  Volunteer,
  ExpiryItem,
} from "../types";

export const mockMpLogs: MpLog[] = [
  {
    id: 1,
    date: "2025-01-15",
    clientId: 1,
    mpId: 1,
    services: ["Consultation", "Document Review"],
    hoursLogged: 2.5,
    notes: "Initial consultation regarding housing issues",
  },
  {
    id: 2,
    date: "2025-01-16",
    clientId: 2,
    mpId: 2,
    services: ["Meeting", "Follow-up"],
    hoursLogged: 1.5,
    notes: "Follow-up meeting for benefits claim",
  },
  {
    id: 3,
    date: "2025-01-17",
    clientId: 3,
    mpId: 1,
    services: ["Phone Call"],
    hoursLogged: 0.5,
    notes: "Phone consultation about local services",
  },
  {
    id: 4,
    date: "2025-01-18",
    clientId: 1,
    mpId: 3,
    services: ["Document Review", "Consultation"],
    hoursLogged: 3,
    notes: "Review of planning application documents",
  },
  {
    id: 5,
    date: "2025-01-19",
    clientId: 2,
    mpId: 2,
    services: ["Meeting"],
    hoursLogged: 1,
    notes: "Constituency surgery appointment",
  },
];

// New Mock Data for MPs
export const mockMps: Mp[] = [
  {
    id: 1,
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
    transport: "Own Car",
    capacity: "Full",
    trainingRecords: [
      { training: "First Aid", expiry: "2025-10-10" },
      { training: "Safeguarding Adults", expiry: "2026-01-15" },
    ],
  },
  {
    id: 2,
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
    transport: "Public Transport",
    capacity: "Part-time Available",
    trainingRecords: [
      { training: "Food Hygiene", expiry: "2025-08-01" },
      { training: "Manual Handling", expiry: "2026-03-22" },
    ],
  },
  {
    id: 3,
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
    transport: "Own Car, Wheelchair Accessible",
    capacity: "Available Weekends",
    trainingRecords: [{ training: "Basic Life Support", expiry: "2025-07-01" }],
  },
];

// New Mock Data for Volunteers
export const mockVolunteers: Volunteer[] = [
  {
    id: 1,
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
    transport: "Bicycle",
    capacity: "Weekends, 5hrs/week",
    specialisms: ["Organisational Skills", "Public Speaking"],
    trainingRecords: [
      { training: "Data Protection", expiry: "2026-06-30" },
      { training: "Health & Safety Basics", expiry: "2025-12-01" },
    ],
  },
  {
    id: 2,
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
    transport: "Own Car",
    capacity: "Mon, Wed PM",
    trainingRecords: [
      { training: "Mental Health First Aid", expiry: "2027-01-10" },
      { training: "Safeguarding Vulnerable Adults", expiry: "2026-09-05" },
    ],
  },
  {
    id: 3,
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
    transport: "Own Car (Wheelchair accessible)",
    capacity: "Flexible, 10hrs/month",
    specialisms: ["Advanced Driving Course"],
    trainingRecords: [
      { training: "First Aid for Drivers", expiry: "2026-04-12" },
    ],
  },
];

export const mockVolunteerLogs: VolunteerLog[] = [
  {
    id: 1,
    date: "2025-01-15",
    clientId: 1,
    volunteerId: 1,
    activity: "Admin Support",
    hoursLogged: 4,
    notes: "Data entry and filing",
  },
  {
    id: 2,
    date: "2025-01-16",
    clientId: 2,
    volunteerId: 2,
    activity: "Event Planning",
    hoursLogged: 6,
    notes: "Planning community outreach event",
  },
  {
    id: 3,
    date: "2025-01-17",
    clientId: 3,
    volunteerId: 3,
    activity: "Client Support",
    hoursLogged: 3,
    notes: "Assisting with client intake",
  },
];

export const mockMagLogs: MagLog[] = [
  {
    id: 1,
    date: "2025-01-15",
    total: 8,
    attendees: [1, 2, 3],
    notes: "Monthly review and planning session",
  },
  {
    id: 2,
    date: "2025-01-22",
    total: 5,
    attendees: [1, 2],
    notes: "Q1 strategy planning",
  },
];

// New Mock Data for Clients
export const mockClients: Client[] = [
  {
    id: 1,
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
  },
  {
    id: 2,
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
  },
  {
    id: 3,
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
  },
];

// New Mock Data for Client Requests
export const mockClientRequests: ClientRequest[] = [
  {
    id: 1,
    clientId: 1,
    requestType: "volunteer",
    startDate: "2025-06-10",
    schedule: "Tuesdays, 2 PM - 4 PM",
    status: "pending",
  },
  {
    id: 2,
    clientId: 2,
    requestType: "paid",
    startDate: "2025-07-01",
    schedule: "First Monday of the month, 10 AM",
    status: "approved",
  },
  {
    id: 3,
    clientId: 1,
    requestType: "volunteer",
    startDate: "2025-08-01",
    schedule: "Fridays, 10 AM - 12 PM",
    status: "approved",
  },
  {
    id: 4,
    clientId: 3,
    requestType: "volunteer",
    startDate: "2025-06-15",
    schedule: "Flexible, ad-hoc",
    status: "pending",
  },
];

// Generate expiry data from MPs and Volunteers
const generateExpiries = (): ExpiryItem[] => {
  const expiries: ExpiryItem[] = [];
  let idCounter = 1;

  // MP DBS expiries
  mockMps.forEach((mp) => {
    if (mp.dbsExpiry) {
      expiries.push({
        id: idCounter++,
        date: mp.dbsExpiry,
        type: "dbs",
        person: { id: mp.id, type: "MP", name: mp.name },
        name: "DBS Check",
      });
    }

    // MP training expiries
    mp.trainingRecords.forEach((training) => {
      expiries.push({
        id: idCounter++,
        date: training.expiry,
        type: "training",
        person: { id: mp.id, type: "MP", name: mp.name },
        name: training.training,
      });
    });
  });

  // Volunteer DBS expiries
  mockVolunteers.forEach((volunteer) => {
    if (volunteer.dbsExpiry) {
      expiries.push({
        id: idCounter++,
        date: volunteer.dbsExpiry,
        type: "dbs",
        person: { id: volunteer.id, type: "Volunteer", name: volunteer.name },
        name: "DBS Check",
      });
    }

    // Volunteer training expiries
    volunteer.trainingRecords.forEach((training) => {
      expiries.push({
        id: idCounter++,
        date: training.expiry,
        type: "training",
        person: { id: volunteer.id, type: "Volunteer", name: volunteer.name },
        name: training.training,
      });
    });
  });

  return expiries.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};

export const mockExpiries = generateExpiries();
