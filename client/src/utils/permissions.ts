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
    {
      key: "packages",
      label: "Packages",
      path: "/packages",
      resource: "packages",
    },
    {
      key: "mag",
      label: "MAG",
      path: "/mag",
      resource: "mag",
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
      key: "dbs",
      label: "DBS",
      path: "/dbs",
      resource: "volunteers", // DBS requires both volunteers and mps permissions
    },
    {
      key: "public-liability",
      label: "Public Liability",
      path: "/public-liability",
      resource: "volunteers", // Public Liability requires both volunteers and mps permissions
    },
    {
      key: "requests",
      label: "Requests",
      path: "/requests",
      resource: "requests",
    },
  ];

  return allMenuItems.filter((item) => {
    // Dashboard should be visible if user has read access to any of the core resources
    if (item.resource === "dashboard") {
      return (
        hasPermission(userRole, "packages", "read") ||
        hasPermission(userRole, "clients", "read") ||
        hasPermission(userRole, "mps", "read") ||
        hasPermission(userRole, "volunteers", "read")
      );
    }

    // DBS requires both volunteers and mps permissions
    if (item.key === "dbs") {
      return (
        hasPermission(userRole, "volunteers", "read") &&
        hasPermission(userRole, "mps", "read")
      );
    }

    // Public Liability requires both volunteers and mps permissions
    if (item.key === "public-liability") {
      return (
        hasPermission(userRole, "volunteers", "read") &&
        hasPermission(userRole, "mps", "read")
      );
    }

    return hasPermission(userRole, item.resource, "read");
  });
}
