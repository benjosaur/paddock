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
