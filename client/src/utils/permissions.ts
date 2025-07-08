import { Permission, rolePermissions } from "shared/permissions";
import type { UserRole } from "../types";

export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: keyof Permission
): boolean {
  return rolePermissions[userRole]?.[resource]?.[action] ?? false;
}

export function getVisibleMenuItems(userRole: UserRole) {
  const allMenuItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      path: "/dashboard",
      resource: "dashboard",
    },
    { key: "mp-logs", label: "MP Logs", path: "/mp-logs", resource: "mpLogs" },
    {
      key: "volunteer-logs",
      label: "Volunteer Logs",
      path: "/volunteer-logs",
      resource: "volunteerLogs",
    },
    {
      key: "mag-logs",
      label: "MAG Logs",
      path: "/mag-logs",
      resource: "magLogs",
    },
    { key: "clients", label: "Clients", path: "/clients", resource: "clients" },
    { key: "mps", label: "MPs", path: "/mps", resource: "mps" },
    {
      key: "volunteers",
      label: "Volunteers",
      path: "/volunteers",
      resource: "volunteers",
    },
    {
      key: "records",
      label: "Records",
      path: "/records",
      resource: "trainingRecords",
    },
    {
      key: "new-requests",
      label: "New Requests",
      path: "/new-requests",
      resource: "clientRequests",
    },
  ];

  return allMenuItems.filter((item) => {
    // Dashboard should be visible if user has read access to any of the core resources
    if (item.resource === "dashboard") {
      return (
        hasPermission(userRole, "mpLogs", "read") ||
        hasPermission(userRole, "clients", "read") ||
        hasPermission(userRole, "mps", "read") ||
        hasPermission(userRole, "volunteers", "read")
      );
    }
    return hasPermission(userRole, item.resource, "read");
  });
}
