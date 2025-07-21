import { z } from "zod";
import {
  attendanceAllowanceStatus,
  booleanTypes,
  requestStatus,
  requestTypes,
  userRoles,
} from "../const";

export const trainingRecordSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  expiryDate: z.union([z.string().date(), z.literal("")]).default(""),
  details: z.object({ name: z.string(), recordName: z.string().default("") }),
});

export const userRoleSchema = z.enum(userRoles);

export const viewConfigSchema = z.object({
  role: userRoleSchema,
  availableViews: z.array(z.string()),
});

export const packageSchema = z.object({
  id: z.string(),
  carerId: z.string(),
  requestId: z.string(),
  startDate: z.string().date(),
  endDate: z.union([z.string().date(), z.literal("open")]).default("open"),
  details: z.object({
    name: z.string(),
    weeklyHours: z.number(),
    notes: z.string().default(""),
    services: z.array(z.string()).default([]),
  }),
});

export const requestMetadataSchema = z.object({
  id: z.string(),
  requestType: z.enum(requestTypes),
  clientId: z.string(),
  startDate: z.string().date(),
  endDate: z.union([z.string().date(), z.literal("open")]).default("open"),
  details: z.object({
    name: z.string(),
    weeklyHours: z.number().default(0),
    status: z.enum(requestStatus).default("pending"),
    notes: z.string().default(""),
  }),
});

export const requestFullSchema = requestMetadataSchema.extend({
  packages: z.array(packageSchema).default([]),
});

export const magLogSchema = z.object({
  id: z.string(),
  date: z.string(),
  clients: z.array(
    z.object({
      id: z.string(),
      postCode: z.string(),
      details: z.object({ name: z.string() }),
    })
  ),
  mps: z.array(
    z.object({
      id: z.string(),
      details: z.object({ name: z.string() }),
    })
  ),
  volunteers: z.array(
    z.object({
      id: z.string(),
      details: z.object({ name: z.string() }),
    })
  ),
  details: z.object({
    totalClients: z.number(),
    totalFamily: z.number(),
    totalVolunteers: z.number(),
    totalMps: z.number(),
    otherAttendees: z.number(),
    notes: z.string().default(""),
  }),
});

const basePersonDetails = z.object({
  name: z.string(),
  address: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
  nextOfKin: z.string().default(""),
  services: z.array(z.string()).default([]),
  attendsMag: z.boolean().default(false),
  notes: z
    .array(z.object({ date: z.string().date(), note: z.string() }))
    .default([]),
});

export const clientMetadataSchema = z.object({
  id: z.string(),
  archived: z.enum(booleanTypes),
  dateOfBirth: z.string().date(),
  postCode: z.string(),
  details: basePersonDetails.extend({
    referredBy: z.string().default(""),
    clientAgreementDate: z
      .union([z.string().date(), z.literal("")])
      .default(""),
    clientAgreementComments: z.string().default(""),
    riskAssessmentDate: z.union([z.string().date(), z.literal("")]).default(""),
    riskAssessmentComments: z.string().default(""),
    attendanceAllowance: z.enum(attendanceAllowanceStatus),
  }),
  requests: z.array(requestMetadataSchema).default([]),
});

export const clientFullSchema = clientMetadataSchema.extend({
  requests: z.array(requestFullSchema).default([]),
  magLogs: z.array(magLogSchema).default([]),
});

export const mpMetadataSchema = z.object({
  id: z.string(),
  archived: z.enum(booleanTypes),
  dateOfBirth: z.string().default(""),
  postCode: z.string(),
  dbsExpiry: z.union([z.string().date(), z.literal("")]).default(""),
  publicLiabilityExpiry: z
    .union([z.string().date(), z.literal("")])
    .default(""),
  trainingRecords: z.array(trainingRecordSchema).default([]),
  details: basePersonDetails.extend({
    specialisms: z.array(z.string()).default([]),
    transport: z.boolean().default(false),
    capacity: z.string().default(""),
  }),
  packages: z.array(packageSchema).default([]),
});

export const mpFullSchema = mpMetadataSchema.omit({ packages: true }).extend({
  requests: z.array(requestFullSchema).default([]),
});

export const volunteerMetadataSchema = mpMetadataSchema;

export const volunteerFullSchema = mpFullSchema;

export type MpMetadata = z.infer<typeof mpMetadataSchema>;
export type MpFull = z.infer<typeof mpFullSchema>;
export type VolunteerMetadata = z.infer<typeof volunteerMetadataSchema>;
export type VolunteerFull = z.infer<typeof volunteerFullSchema>;
export type ClientMetadata = z.infer<typeof clientMetadataSchema>;
export type ClientFull = z.infer<typeof clientFullSchema>;
export type Package = z.infer<typeof packageSchema>;
export type MagLog = z.infer<typeof magLogSchema>;
export type RequestMetadata = z.infer<typeof requestMetadataSchema>;
export type RequestFull = z.infer<typeof requestFullSchema>;
export type TrainingRecord = z.infer<typeof trainingRecordSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type ViewConfig = z.infer<typeof viewConfigSchema>;
