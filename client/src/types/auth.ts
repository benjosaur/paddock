import { AuthUser } from "aws-amplify/auth";
import { UserRole } from "./index";

export interface PaddockUser extends AuthUser {
  "custom:role": UserRole;
}
