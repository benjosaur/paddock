import { UserRole } from "shared";

export interface PaddockUser {
  givenName: string;
  familyName: string;
  email: string;
  role: UserRole;
}
