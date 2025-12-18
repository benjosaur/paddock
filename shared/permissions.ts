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
  Test: {
    clients: { read: true, create: true, update: true, delete: true },
    mps: { read: true, create: true, update: true, delete: true },
    volunteers: { read: true, create: true, update: true, delete: true },
    packages: { read: true, create: true, update: true, delete: true },
    mag: { read: true, create: true, update: true, delete: true },
    requests: { read: true, create: true, update: true, delete: true },
    trainingRecords: {
      read: true,
      create: true,
      update: true,
      delete: true,
    },
    analytics: { read: true, create: false, update: false, delete: false },
  },
  Admin: {
    clients: { read: true, create: true, update: true, delete: true },
    mps: { read: true, create: true, update: true, delete: true },
    volunteers: { read: true, create: true, update: true, delete: true },
    packages: { read: true, create: true, update: true, delete: true },
    mag: { read: true, create: true, update: true, delete: true },
    requests: { read: true, create: true, update: true, delete: true },
    trainingRecords: {
      read: true,
      create: true,
      update: true,
      delete: true,
    },
    analytics: { read: true, create: false, update: false, delete: false },
  },
  Trustee: {
    clients: { read: true, create: false, update: false, delete: false },
    mps: { read: true, create: false, update: false, delete: false },
    volunteers: { read: true, create: false, update: false, delete: false },
    packages: { read: true, create: false, update: false, delete: false },
    mag: { read: true, create: false, update: false, delete: false },
    requests: { read: true, create: false, update: false, delete: false },
    trainingRecords: {
      read: true,
      create: false,
      update: false,
      delete: false,
    },
    analytics: { read: true, create: false, update: false, delete: false },
  },
  Coordinator: {
    clients: { read: true, create: true, update: true, delete: true },
    mps: { read: true, create: true, update: true, delete: true },
    volunteers: { read: true, create: true, update: true, delete: true },
    packages: { read: true, create: true, update: true, delete: true },
    mag: { read: true, create: true, update: true, delete: true },
    requests: { read: true, create: true, update: true, delete: true },
    trainingRecords: {
      read: true,
      create: true,
      update: true,
      delete: true,
    },
    analytics: { read: true, create: true, update: true, delete: true },
  },
  Finance: {
    clients: { read: true, create: false, update: false, delete: false },
    mps: { read: false, create: false, update: false, delete: false },
    volunteers: { read: true, create: false, update: false, delete: false },
    packages: { read: true, create: false, update: false, delete: false },
    mag: { read: true, create: false, update: false, delete: false },
    requests: { read: true, create: false, update: false, delete: false },
    trainingRecords: {
      read: false,
      create: false,
      update: false,
      delete: false,
    },
    analytics: { read: true, create: false, update: false, delete: false },
  },
};
