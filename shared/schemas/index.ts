import { z } from "zod";
import { requestStatuses, requestTypes, userRoles } from "../options";

export const trainingRecordSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  recordName: z.string().default(""),
  recordExpiry: z.union([z.string().date(), z.literal("n/a")]).default("n/a"),
  details: z.object({ name: z.string() }),
});

export const userRoleSchema = z.enum(userRoles);

export const viewConfigSchema = z.object({
  role: userRoleSchema,
  availableViews: z.array(z.string()),
});

export const clientRequestSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  requestType: z.enum(requestTypes),
  startDate: z.string().date(),
  details: z.object({
    name: z.string(),
    notes: z.string().default(""),
    schedule: z.string().default(""),
    status: z.enum(requestStatuses).default("pending"),
  }),
});

export const mpLogSchema = z.object({
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
  details: z.object({
    hoursLogged: z.number(),
    notes: z.string().default(""),
    services: z.array(z.string()).default([]),
  }),
});

export const volunteerLogSchema = mpLogSchema.omit({ mps: true }).extend({
  volunteers: z.array(
    z.object({
      id: z.string(),
      details: z.object({ name: z.string() }),
    })
  ),
});

export const magLogSchema = z.object({
  id: z.string(),
  date: z.string(),
  clients: z.array(
    z.object({
      id: z.string(),
      details: z.object({ name: z.string() }),
    })
  ),
  details: z.object({
    total: z.number(),
    notes: z.string().default(""),
  }),
});

const basePersonDetails = z.object({
  name: z.string(),
  address: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
  nextOfKin: z.string().default(""),
  needs: z.array(z.string()).default([]),
  services: z.array(z.string()).default([]),
  notes: z.string().default(""),
});

export const clientMetadataSchema = z.object({
  id: z.string(),
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
    attendanceAllowance: z.string().default(""),
    attendsMag: z.boolean().default(false),
  }),
  mpRequests: z
    .array(
      clientRequestSchema
        .omit({ requestType: true })
        .extend({ requestType: z.literal("mp") })
    )
    .default([]),
  volunteerRequests: z
    .array(
      clientRequestSchema
        .omit({ requestType: true })
        .extend({ requestType: z.literal("volunteer") })
    )
    .default([]),
});

export const clientFullSchema = clientMetadataSchema.extend({
  mpLogs: z.array(mpLogSchema).default([]),
  volunteerLogs: z.array(volunteerLogSchema).default([]),
  magLogs: z.array(magLogSchema).default([]),
});

export const mpMetadataSchema = z.object({
  id: z.string(),
  dateOfBirth: z.string().default(""),
  postCode: z.string(),
  recordName: z.string().default(""),
  recordExpiry: z.union([z.string().date(), z.literal("n/a")]).default("n/a"),
  trainingRecords: z.array(trainingRecordSchema).default([]),
  details: basePersonDetails.extend({
    specialisms: z.array(z.string()).default([]),
    transport: z.boolean(),
    capacity: z.string(),
  }),
});

export const mpFullSchema = mpMetadataSchema.extend({
  mpLogs: z.array(mpLogSchema).default([]),
});

export const volunteerMetadataSchema = mpMetadataSchema;

export const volunteerFullSchema = mpFullSchema.omit({ mpLogs: true }).extend({
  volunteerLogs: z.array(volunteerLogSchema).default([]),
});

export type MpMetadata = z.infer<typeof mpMetadataSchema>;
export type MpFull = z.infer<typeof mpFullSchema>;
export type VolunteerMetadata = z.infer<typeof volunteerMetadataSchema>;
export type VolunteerFull = z.infer<typeof volunteerFullSchema>;
export type ClientMetadata = z.infer<typeof clientMetadataSchema>;
export type ClientFull = z.infer<typeof clientFullSchema>;
export type MpLog = z.infer<typeof mpLogSchema>;
export type VolunteerLog = z.infer<typeof volunteerLogSchema>;
export type MagLog = z.infer<typeof magLogSchema>;
export type ClientRequest = z.infer<typeof clientRequestSchema>;
export type TrainingRecord = z.infer<typeof trainingRecordSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type ViewConfig = z.infer<typeof viewConfigSchema>;
