// Nullable is used in favour of optional to force frontend to send in full data schema
// Null will be stripped before entry into dynamoDB
// On receipt from db Zod Schema Parsers will have .default("") to ensure present before passed back

import { z } from "zod";

export const trainingRecordItemSchema = z.object({
  training: z.string(),
  expiry: z.string(),
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
  phone: z.string().nullable(),
  email: z.string().nullable(),
  nextOfKin: z.string().nullable(),
  needs: z.array(z.string()).nullable(),
  services: z.array(z.string()).nullable(),
  notes: z.string().nullable(),
});

export const clientMetadataSchema = z.object({
  id: z.string(),
  dateOfBirth: z.string().datetime(),
  postCode: z.string(),
  details: basePersonDetails.extend({
    referredBy: z.string().nullable(),
    clientAgreementDate: z.string().datetime().nullable(),
    clientAgreementComments: z.string().nullable(),
    riskAssessmentDate: z.string().datetime().nullable(),
    riskAssessmentComments: z.string().nullable(),
    attendanceAllowance: z.string().nullable(),
    attendsMag: z.boolean(),
  }),
  mpRequests: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      details: z.object({ notes: z.string().nullable() }),
    })
  ),
  volunteerRequests: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      details: z.object({ notes: z.string().nullable() }),
    })
  ),
});

export const clientFullSchema = clientMetadataSchema.extend({
  mpLogs: z.array(
    z.object({
      id: z.string(),
      date: z.string().datetime(),
      details: z.object({ notes: z.string().optional() }),
    })
  ),
  volunteerLogs: z.array(
    z.object({
      id: z.string(),
      date: z.string().datetime(),
      details: z.object({ notes: z.string().optional() }),
    })
  ),
  magLogs: z.array(
    z.object({
      id: z.string(),
      date: z.string().datetime(),
      details: z.object({ notes: z.string().optional() }),
    })
  ),
});

export const mpSchema = z.object({
  id: z.string(),
  name: z.string(),
  dateOfBirth: z.string().optional(),
  address: z.string(),
  postCode: z.string(),
  phone: z.string(),
  email: z.string().email(),
  nextOfKin: z.string(),
  dbsNumber: z.string().optional(),
  dbsExpiry: z.string(),
  servicesOffered: z.array(z.string()),
  specialisms: z.array(z.string()),
  transport: z.boolean(),
  capacity: z.string(),
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

export const createMpSchema = mpSchema.omit({ id: true });
export const createVolunteerSchema = volunteerSchema.omit({ id: true });
export const createClientSchema = clientMetadataSchema.omit({ id: true });
export const createMpLogSchema = mpLogSchema.omit({ id: true });
export const createVolunteerLogSchema = volunteerLogSchema.omit({ id: true });
export const createMagLogSchema = magLogSchema.omit({ id: true });
export const createClientRequestSchema = clientRequestSchema.omit({ id: true });

export const updateMpSchema = mpSchema.partial().extend({ id: z.string() });
export const updateVolunteerSchema = volunteerSchema
  .partial()
  .extend({ id: z.string() });
export const updateClientSchema = clientFullSchema
  .partial()
  .extend({ id: z.string() });
export const updateMpLogSchema = mpLogSchema
  .partial()
  .extend({ id: z.string() });
export const updateVolunteerLogSchema = volunteerLogSchema
  .partial()
  .extend({ id: z.string() });
export const updateMagLogSchema = magLogSchema
  .partial()
  .extend({ id: z.string() });
export const updateClientRequestSchema = clientRequestSchema
  .partial()
  .extend({ id: z.string() });

export const idParamSchema = z.object({
  id: z.string(),
});

export type Mp = z.infer<typeof mpSchema>;
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
