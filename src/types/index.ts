export interface MpLog {
  id: string;
  date: string;
  client: string;
  mp: string;
  services: string[];
  notes: string;
}

export interface VolunteerLog {
  id: string;
  date: string;
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
