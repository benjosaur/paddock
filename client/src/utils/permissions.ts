import type { UserRole } from '../types';

interface Permission {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

interface RolePermissions {
  [key: string]: Permission;
}

const rolePermissions: Record<UserRole, RolePermissions> = {
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
  Fundraiser: {
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

export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: keyof Permission
): boolean {
  return rolePermissions[userRole]?.[resource]?.[action] ?? false;
}

export function getVisibleMenuItems(userRole: UserRole) {
  const allMenuItems = [
    { key: "mp-logs", label: "MP Logs", path: "/mp-logs", resource: "mpLogs" },
    { key: "volunteer-logs", label: "Volunteer Logs", path: "/volunteer-logs", resource: "volunteerLogs" },
    { key: "mag-logs", label: "MAG Logs", path: "/mag-logs", resource: "magLogs" },
    { key: "clients", label: "Clients", path: "/clients", resource: "clients" },
    { key: "mps", label: "MPs", path: "/mps", resource: "mps" },
    { key: "volunteers", label: "Volunteers", path: "/volunteers", resource: "volunteers" },
    { key: "expiries", label: "Expiries", path: "/expiries", resource: "expiries" },
    { key: "new-requests", label: "New Requests", path: "/new-requests", resource: "clientRequests" },
  ];

  return allMenuItems.filter(item => 
    hasPermission(userRole, item.resource, 'read')
  );
}
