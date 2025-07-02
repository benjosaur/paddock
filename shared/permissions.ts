import { UserRole } from "./schemas";

export interface Permission {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

interface RolePermissions {
  [key: string]: Permission;
}

export const rolePermissions: Record<UserRole, RolePermissions> = {
  Admin: {
    clients: { read: true, create: true, update: true, delete: true },
    mps: { read: true, create: true, update: true, delete: true },
    volunteers: { read: true, create: true, update: true, delete: true },
    mpLogs: { read: true, create: true, update: true, delete: true },
    volunteerLogs: { read: true, create: true, update: true, delete: true },
    magLogs: { read: true, create: true, update: true, delete: true },
    clientRequests: { read: true, create: true, update: true, delete: true },
    expiries: { read: true, create: false, update: false, delete: false },
  },
  Trustee: {
    clients: { read: true, create: false, update: false, delete: false },
    mps: { read: true, create: false, update: false, delete: false },
    volunteers: { read: true, create: false, update: false, delete: false },
    mpLogs: { read: true, create: false, update: false, delete: false },
    volunteerLogs: { read: true, create: false, update: false, delete: false },
    magLogs: { read: true, create: false, update: false, delete: false },
    clientRequests: { read: true, create: false, update: true, delete: false },
    expiries: { read: true, create: false, update: false, delete: false },
  },
  Coordinator: {
    clients: { read: true, create: true, update: true, delete: false },
    mps: { read: true, create: true, update: true, delete: false },
    volunteers: { read: true, create: true, update: true, delete: false },
    mpLogs: { read: true, create: true, update: true, delete: false },
    volunteerLogs: { read: true, create: true, update: true, delete: false },
    magLogs: { read: true, create: true, update: true, delete: false },
    clientRequests: { read: true, create: true, update: true, delete: false },
    expiries: { read: true, create: false, update: false, delete: false },
  },
  Finance: {
    clients: { read: true, create: false, update: false, delete: false },
    mps: { read: false, create: false, update: false, delete: false },
    volunteers: { read: true, create: false, update: false, delete: false },
    mpLogs: { read: false, create: false, update: false, delete: false },
    volunteerLogs: { read: true, create: false, update: false, delete: false },
    magLogs: { read: true, create: false, update: false, delete: false },
    clientRequests: { read: true, create: false, update: false, delete: false },
    expiries: { read: false, create: false, update: false, delete: false },
  },
};
