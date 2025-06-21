import { z } from "zod";

export const trainingRecordItemSchema = z.object({
  id: z.string(),
  recordName: z.string(),
  recordExpiry: z.union([z.string().datetime(), z.literal("never")]),
});

export const userRoleSchema = z.enum([
  "Admin",
  "Trustee",
  "Coordinator",
  "Finance",
]);

export const viewConfigSchema = z.object({
  role: userRoleSchema,
  availableViews: z.array(z.string()),
});

export const expiryItemSchema = z.object({
  id: z.string(),
  date: z.string(),
  type: z.enum(["training", "dbs"]),
  name: z.string(),
  person: z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(["mp", "volunteer"]),
  }),
});

const basePersonDetails = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string().default(""),
  email: z.string().default(""),
  nextOfKin: z.string().default(""),
  needs: z.array(z.string()).default([]),
  services: z.array(z.string()).default([]),
  notes: z.string().default(""),
});

export const clientMetadataSchema = z.object({
  id: z.string(),
  dateOfBirth: z.string().datetime(),
  postCode: z.string(),
  details: basePersonDetails.extend({
    referredBy: z.string().default(""),
    clientAgreementDate: z.string().datetime().default(""),
    clientAgreementComments: z.string().default(""),
    riskAssessmentDate: z.string().datetime().default(""),
    riskAssessmentComments: z.string().default(""),
    attendanceAllowance: z.string().default(""),
    attendsMag: z.boolean(),
  }),
  mpRequests: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      details: z.object({ notes: z.string().default("") }),
    })
  ),
  volunteerRequests: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      details: z.object({ notes: z.string().default("") }),
    })
  ),
});

export const clientFullSchema = clientMetadataSchema.extend({
  mpLogs: z.array(
    z.object({
      id: z.string(),
      date: z.string().datetime(),
      details: z.object({ notes: z.string().default("") }),
    })
  ),
  volunteerLogs: z.array(
    z.object({
      id: z.string(),
      date: z.string().datetime(),
      details: z.object({ notes: z.string().default("") }),
    })
  ),
  magLogs: z.array(
    z.object({
      id: z.string(),
      date: z.string().datetime(),
      details: z.object({ notes: z.string().default("") }),
    })
  ),
});

export const mpMetadataSchema = z.object({
  id: z.string(),
  dateOfBirth: z.string().default(""),
  postCode: z.string(),
  recordName: z.string().default(""),
  recordExpiry: z.string(),
  details: basePersonDetails.extend({
    specialisms: z.array(z.string()).default([]),
    transport: z.boolean(),
    capacity: z.string(),
  }),
});

export const mpFullSchema = mpMetadataSchema.extend({
  mpLogs: z.array(
    z.object({
      id: z.string(),
      date: z.string().datetime(),
      details: z.object({ notes: z.string().default("") }),
    })
  ),
  trainingRecords: z.array(trainingRecordItemSchema),
});

export const volunteerSchema = z.object({
  id: z.string(),
  name: z.string(),
  dateOfBirth: z.string().optional(),
  address: z.string(),
  postCode: z.string(),
  phone: z.string(),
  email: z.string().email(),
  nextOfKin: z.string(),
  dbsNumber: z.string().optional(),
  dbsExpiry: z.string().optional(),
  servicesOffered: z.array(z.string()),
  needTypes: z.array(z.string()),
  transport: z.boolean(),
  capacity: z.string(),
  specialisms: z.array(z.string()).optional(),
  trainingRecords: z.array(trainingRecordItemSchema),
});

export const mpLogSchema = z.object({
  id: z.string(),
  date: z.string(),
  clientId: z.string(),
  mpId: z.string(),
  services: z.array(z.string()),
  hoursLogged: z.number(),
  notes: z.string(),
});

export const volunteerLogSchema = z.object({
  id: z.string(),
  date: z.string(),
  clientId: z.string(),
  volunteerId: z.string(),
  activity: z.string(),
  hoursLogged: z.number(),
  notes: z.string(),
});

export const magLogSchema = z.object({
  id: z.string(),
  date: z.string(),
  total: z.number(),
  attendees: z.array(z.string()),
  notes: z.string(),
});

export const clientRequestSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  requestType: z.enum(["mp", "volunteer"]),
  startDate: z.string(),
  schedule: z.string(),
  status: z.string(),
});

export const createMpSchema = mpFullSchema.omit({ id: true });
export const createVolunteerSchema = volunteerSchema.omit({ id: true });
export const createClientSchema = clientFullSchema.omit({ id: true });
export const createMpLogSchema = mpLogSchema.omit({ id: true });
export const createVolunteerLogSchema = volunteerLogSchema.omit({ id: true });
export const createMagLogSchema = magLogSchema.omit({ id: true });
export const createClientRequestSchema = clientRequestSchema.omit({ id: true });

export const updateMpSchema = mpFullSchema;
export const updateVolunteerSchema = volunteerSchema;
export const updateClientSchema = clientFullSchema;
export const updateMpLogSchema = mpLogSchema;
export const updateVolunteerLogSchema = volunteerLogSchema;
export const updateMagLogSchema = magLogSchema;
export const updateClientRequestSchema = clientRequestSchema;

export const idParamSchema = z.object({
  id: z.string(),
});

export type MpMetadata = z.infer<typeof mpMetadataSchema>;
export type MpFull = z.infer<typeof mpFullSchema>;
export type Volunteer = z.infer<typeof volunteerSchema>;
export type ClientMetadata = z.infer<typeof clientMetadataSchema>;
export type ClientFull = z.infer<typeof clientFullSchema>;
export type MpLog = z.infer<typeof mpLogSchema>;
export type VolunteerLog = z.infer<typeof volunteerLogSchema>;
export type MagLog = z.infer<typeof magLogSchema>;
export type ClientRequest = z.infer<typeof clientRequestSchema>;
export type TrainingRecordItem = z.infer<typeof trainingRecordItemSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type ViewConfig = z.infer<typeof viewConfigSchema>;
export type ExpiryItem = z.infer<typeof expiryItemSchema>;

export type CreateMpRequest = z.infer<typeof createMpSchema>;
export type CreateVolunteerRequest = z.infer<typeof createVolunteerSchema>;
export type CreateClientRequest = z.infer<typeof createClientSchema>;
export type CreateMpLogRequest = z.infer<typeof createMpLogSchema>;
export type CreateVolunteerLogRequest = z.infer<
  typeof createVolunteerLogSchema
>;
export type CreateMagLogRequest = z.infer<typeof createMagLogSchema>;
export type CreateClientRequestRequest = z.infer<
  typeof createClientRequestSchema
>;
