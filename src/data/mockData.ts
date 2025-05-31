import type { MpLog, VolunteerLog, MagLog } from "../types";

export const mockMpLogs: MpLog[] = [
  {
    id: "1",
    date: "2025-01-15",
    client: "John Smith",
    mp: "Sarah Johnson",
    services: ["Consultation", "Document Review"],
    notes: "Initial consultation regarding housing issues",
  },
  {
    id: "2",
    date: "2025-01-16",
    client: "Mary Brown",
    mp: "David Wilson",
    services: ["Meeting", "Follow-up"],
    notes: "Follow-up meeting for benefits claim",
  },
  {
    id: "3",
    date: "2025-01-17",
    client: "Robert Davis",
    mp: "Sarah Johnson",
    services: ["Phone Call"],
    notes: "Phone consultation about local services",
  },
  {
    id: "4",
    date: "2025-01-18",
    client: "Emma Wilson",
    mp: "Michael Thompson",
    services: ["Document Review", "Consultation"],
    notes: "Review of planning application documents",
  },
  {
    id: "5",
    date: "2025-01-19",
    client: "James Taylor",
    mp: "David Wilson",
    services: ["Meeting"],
    notes: "Constituency surgery appointment",
  },
];

export const mockVolunteerLogs: VolunteerLog[] = [
  {
    id: "1",
    date: "2025-01-15",
    volunteer: "Alice Cooper",
    activity: "Admin Support",
    hoursLogged: 4,
    notes: "Data entry and filing",
  },
  {
    id: "2",
    date: "2025-01-16",
    volunteer: "Bob Stevens",
    activity: "Event Planning",
    hoursLogged: 6,
    notes: "Planning community outreach event",
  },
  {
    id: "3",
    date: "2025-01-17",
    volunteer: "Carol White",
    activity: "Client Support",
    hoursLogged: 3,
    notes: "Assisting with client intake",
  },
];

export const mockMagLogs: MagLog[] = [
  {
    id: "1",
    date: "2025-01-15",
    attendee: "Management Meeting",
    total: 8,
    attendees: ["Sarah Johnson", "David Wilson", "Michael Thompson", "Emma Clarke", "James Wright", "Lisa Brown", "Mark Davis", "Jane Smith"],
    notes: "Monthly review and planning session",
  },
  {
    id: "2",
    date: "2025-01-22",
    attendee: "Strategy Session",
    total: 5,
    attendees: ["Sarah Johnson", "David Wilson", "Michael Thompson", "Emma Clarke", "James Wright"],
    notes: "Q1 strategy planning",
  },
];
