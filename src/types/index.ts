export interface MpLog {
  id: string;
  date: string;
  client: string;
  mp: string;
  services: string[];
  hoursLogged: number;
  notes: string;
}

export interface VolunteerLog {
  id: string;
  date: string;
  client: string;
  volunteer: string;
  activity: string;
  hoursLogged: number;
  notes: string;
}

export interface MagLog {
  id: string;
  date: string;
  attendee: string;
  total: number;
  attendees: string[];
  notes: string;
}

export type UserRole = "Admin" | "Trustee" | "Coordinator" | "Fundraiser";

export interface ViewConfig {
  role: UserRole;
  availableViews: string[];
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

export interface ClientRequest {
  id: string;
  clientId: string;
  requestType: "paid" | "volunteer";
  startDate: string;
  schedule: string; // e.g., "Mon, Wed, Fri at 10:00"
  status: "pending" | "approved" | "rejected";
}

export interface TrainingRecordItem {
  training: string;
  expiry: string;
}

export interface Mp {
  id: string;
  // Contact Information from modal & table
  name: string;
  address: string;
  postCode: string;
  phone: string;
  email: string;
  nextOfKin: string;
  dbsNumber?: string; // From "DBS" in contact info, assuming it's the number
  dbsExpiry: string; // From table
  age?: number; // From table
  // Offerings from modal & table
  servicesOffered: string[];
  specialisms: string[];
  transport: string; // From table "Transport?" and modal "Transport"
  capacity: string; // From table "Capacity?" and modal "Capacity"
  // Training Record from modal
  trainingRecords: TrainingRecordItem[];
  // Logs - will use MpLog, filtered by MP's name or ID
}

export interface Volunteer {
  id: string;
  // Contact Information
  name: string;
  age?: number;
  address: string;
  postCode: string;
  phone: string;
  email: string;
  nextOfKin: string;
  dbsNumber?: string;
  dbsExpiry?: string;
  // Offerings / Skills
  servicesOffered: string[]; // Corresponds to "Services" in table
  needTypes: string[]; // Corresponds to "Need Types" in table
  transport: string; // Corresponds to "Transport?" in table
  capacity: string; // Corresponds to "Capacity?" in table
  specialisms?: string[]; // From "Offerings" tab, not directly in table overview
  // Training Record
  trainingRecords: TrainingRecordItem[];
  // Logs will use VolunteerLog, filtered by Volunteer's name or ID
}

export interface Client {
  id: string;
  // Contact Information
  name: string;
  dob: string;
  address: string;
  postCode: string;
  phone: string;
  email: string;
  nextOfKin: string;
  referredBy: string; // referred by/on
  // Services
  clientAgreementDate?: string;
  clientAgreementComments?: string;
  riskAssessmentDate?: string;
  riskAssessmentComments?: string;
  needs: string[];
  servicesProvided: string[]; // Renamed from 'services' to avoid conflict if used elsewhere
  // Fields from image that might be relevant or part of a different data structure
  age?: number; // Can be calculated from DOB
  hasMp?: boolean; // "has MP?"
  hasAttendanceAllowance?: boolean; // "has Attendance Allowance?"
}

export interface ExpiryItem {
  id: string;
  date: string;
  type: "training" | "dbs";
  mpVolunteer: string;
  name: string;
  personType: "MP" | "Volunteer";
}
