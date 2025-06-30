import { z } from "zod";

export const trainingRecordSchema = z.object({
  id: z.string(),
  owner: z.union([z.literal("mp"), z.literal("volunteer")]),
  recordName: z.string().default(""),
  recordExpiry: z
    .union([z.string().datetime(), z.literal("n/a")])
    .default("n/a"),
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
  mpRequests: z
    .array(
      z.object({
        id: z.string(),
        date: z.string(),
        details: z.object({ notes: z.string().default("") }),
      })
    )
    .default([]),
  volunteerRequests: z
    .array(
      z.object({
        id: z.string(),
        date: z.string(),
        details: z.object({ notes: z.string().default("") }),
      })
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
  recordExpiry: z
    .union([z.string().datetime(), z.literal("n/a")])
    .default("n/a"),
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

export const clientRequestSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  requestType: z.enum(["mp", "volunteer"]),
  startDate: z.string(),
  schedule: z.string(),
  status: z.string(),
});

export const createMpSchema = mpFullSchema.omit({ id: true });
export const createVolunteerSchema = volunteerFullSchema.omit({ id: true });
export const createClientSchema = clientFullSchema.omit({ id: true });
export const createMpLogSchema = mpLogSchema.omit({ id: true });
export const createVolunteerLogSchema = volunteerLogSchema.omit({ id: true });
export const createMagLogSchema = magLogSchema.omit({ id: true });
export const createClientRequestSchema = clientRequestSchema.omit({ id: true });

export const updateMpSchema = mpFullSchema;
export const updateVolunteerSchema = volunteerFullSchema;
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
