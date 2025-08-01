import { z } from "zod";
import {
  attendanceAllowanceStatus,
  booleanTypes,
  localities,
  requestStatus,
  requestTypes,
  serviceOptions,
  userRoles,
} from "../const";

export const trainingRecordSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  // below if parent carer is archived
  archived: z.enum(booleanTypes),
  expiryDate: z.union([z.string().date(), z.literal("")]).default(""),
  details: z.object({ name: z.string(), recordName: z.string().default("") }),
});

export const userRoleSchema = z.enum(userRoles);

export const viewConfigSchema = z.object({
  role: userRoleSchema,
  availableViews: z.array(z.string()),
});

const addressSchema = z.object({
  streetAddress: z.string().default(""),
  locality: z.enum(localities).default("Wiveliscombe"),
  county: z.string().default("Somerset"),
  postCode: z.string().transform((val) => val.toUpperCase()),
});

const addressSchemaWithDeprivation = addressSchema.extend({
  deprivation: z
    .object({
      income: z.boolean().default(false),
      health: z.boolean().default(false),
    })
    .default({
      income: false,
      health: false,
    }),
});

export const packageSchema = z.object({
  id: z.string(),
  //below if parent carer is archived
  archived: z.enum(booleanTypes),
  carerId: z.string(),
  requestId: z.string(),
  startDate: z.string().date(),
  endDate: z.union([z.string().date(), z.literal("open")]).default("open"),
  details: z.object({
    name: z.string(),
    weeklyHours: z.number().default(1),
    address: addressSchemaWithDeprivation,
    notes: z.string().default(""),
    services: z.array(z.enum(serviceOptions)).default([]),
  }),
});

export const requestMetadataSchema = z.object({
  id: z.string(),
  //below if parent client is archived
  archived: z.enum(booleanTypes),
  requestType: z.enum(requestTypes),
  clientId: z.string(),
  startDate: z.string().date(),
  endDate: z.union([z.string().date(), z.literal("open")]).default("open"),
  details: z.object({
    name: z.string(),
    weeklyHours: z.number().default(1),
    address: addressSchemaWithDeprivation,
    status: z.enum(requestStatus).default("pending"),
    services: z.array(z.enum(serviceOptions)).default([]),
    notes: z.string().default(""),
  }),
});

export const requestFullSchema = requestMetadataSchema.extend({
  packages: z.array(packageSchema).default([]),
});

export const magLogSchema = z.object({
  id: z.string(),
  archived: z.enum(booleanTypes),
  date: z.string(),
  clients: z.array(
    z.object({
      id: z.string(),
      //below if parent is archived
      archived: z.enum(booleanTypes),
      details: z.object({
        name: z.string(),
        address: addressSchemaWithDeprivation,
      }),
    })
  ),
  mps: z.array(
    z.object({
      id: z.string(),
      archived: z.enum(booleanTypes),
      details: z.object({ name: z.string() }),
    })
  ),
  volunteers: z.array(
    z.object({
      id: z.string(),
      archived: z.enum(booleanTypes),
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
  address: addressSchema,
  phone: z.string().default(""),
  email: z.string().default(""),
  nextOfKin: z.string().default(""),
  services: z.array(z.enum(serviceOptions)).default([]),
  attendsMag: z.boolean().default(false),
  notes: z
    .array(z.object({ date: z.string().date(), note: z.string() }))
    .default([]),
});

export const clientMetadataSchema = z.object({
  id: z.string(),
  archived: z.enum(booleanTypes),
  dateOfBirth: z.string().date(),
  details: basePersonDetails.omit({ address: true }).extend({
    address: addressSchemaWithDeprivation,
    donationScheme: z.boolean().default(false),
    donationAmount: z.number().default(0),
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
  dbsExpiry: z.union([z.string().date(), z.literal("")]).default(""),
  publicLiabilityExpiry: z
    .union([z.string().date(), z.literal("")])
    .default(""),
  trainingRecords: z.array(trainingRecordSchema).default([]),
  details: basePersonDetails.extend({
    specialisms: z.array(z.string()).default([]),
    capacity: z.string().default(""),
  }),
  packages: z.array(packageSchema).default([]),
});

export const mpFullSchema = mpMetadataSchema.omit({ packages: true }).extend({
  requests: z.array(requestFullSchema).default([]),
});

export const volunteerMetadataSchema = mpMetadataSchema;

export const volunteerFullSchema = mpFullSchema;

export const crossSectionSchema = z.object({
  totalHours: z.number().default(0),
  localities: z
    .array(
      z.object({
        name: z.string(),
        services: z.array(
          z.object({
            name: z.enum(serviceOptions),
            totalHours: z.number().default(0),
          })
        ),
        totalHours: z.number().default(0),
      })
    )
    .default([]),
  services: z
    .array(
      z.object({
        name: z.enum(serviceOptions),
        totalHours: z.number().default(0),
      })
    )
    .default([]),
});

export const reportMonthSchema = crossSectionSchema.extend({
  month: z.number(),
});

export const reportYearSchema = crossSectionSchema.extend({
  year: z.number(),
  months: z.array(reportMonthSchema),
});

export const reportSchema = z.object({
  years: z.array(reportYearSchema),
});

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
export type CrossSection = z.infer<typeof crossSectionSchema>;
export type ReportMonth = z.infer<typeof reportMonthSchema>;
export type ReportYear = z.infer<typeof reportYearSchema>;
export type Report = z.infer<typeof reportSchema>;
