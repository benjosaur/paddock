import { z } from "zod";
import {
  attendanceAllowanceLevels,
  attendanceAllowanceStatuses,
  endReasons,
  localities,
  notesSource,
  requestStatus,
  requestTypes,
  serviceOptions,
  soleServiceOptions,
  trainingRecordTypes,
  userRoles,
  volunteerRoles,
} from "../const";

export const trainingRecordSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  completionDate: z.union([z.string().date(), z.literal("")]).default(""),
  expiryDate: z.string().date(),
  endDate: z.union([z.string().date(), z.literal("open")]).default("open"),
  details: z.object({
    name: z.string(),
    recordName: z.enum(trainingRecordTypes),
    recordNumber: z.string().default(""),
    notes: z.string().default(""),
  }),
});

export const userRoleSchema = z.enum(userRoles);

export const viewConfigSchema = z.object({
  role: userRoleSchema,
  availableViews: z.array(z.string()),
});

const addressSchema = z.object({
  streetAddress: z.string().default(""),
  locality: z.enum(localities).default("Unknown"),
  county: z.string().default("Somerset"),
  postCode: z
    .string()
    .transform((val) => val.toUpperCase())
    .default(""),
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

export const reqPackageSchema = z.object({
  id: z.string(),
  carerId: z.string(),
  requestId: z.string(),
  startDate: z.string().date(),
  endDate: z.union([z.string().date(), z.literal("open")]).default("open"),
  details: z.object({
    // mp/v owner name
    name: z.string(),
    weeklyHours: z.coerce.number().default(0),
    oneOffStartDateHours: z.coerce.number().default(0),
    address: addressSchemaWithDeprivation,
    notes: z.string().default(""),
    services: z.array(z.enum(serviceOptions)).default([]),
  }),
});

export const solePackageSchema = reqPackageSchema
  .pick({
    id: true,
    carerId: true,
    startDate: true,
    endDate: true,
  })
  .extend({
    details: reqPackageSchema.shape.details
      .omit({ address: true, services: true })
      .extend({
        services: z.array(z.enum(soleServiceOptions)),
      }),
  });

export const packageSchema = z.union([reqPackageSchema, solePackageSchema]);

export const requestMetadataSchema = z.object({
  id: z.string(),
  requestType: z.enum(requestTypes),
  clientId: z.string(),
  startDate: z.string().date(),
  endDate: z.union([z.string().date(), z.literal("open")]).default("open"),
  details: z.object({
    customId: z.string().default(""),
    //client owner name
    name: z.string(),
    weeklyHours: z.coerce.number().default(0),
    oneOffStartDateHours: z.coerce.number().default(0),
    address: addressSchemaWithDeprivation,
    status: z.enum(requestStatus).default("normal"),
    services: z.array(z.enum(serviceOptions)).default([]),
    notes: z.string().default(""),
  }),
});

export const requestFullSchema = requestMetadataSchema.extend({
  packages: z.array(packageSchema).default([]),
});

export const magLogSchema = z.object({
  id: z.string(),
  date: z.string(),
  totalHours: z.coerce.number().default(0),
  clients: z.array(
    z.object({
      id: z.string(),
      details: z.object({
        name: z.string(),
        address: addressSchemaWithDeprivation,
      }),
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
    totalClients: z.coerce.number().default(0),
    totalFamily: z.coerce.number().default(0),
    totalVolunteers: z.coerce.number().default(0),
    totalMps: z.coerce.number().default(0),
    otherAttendees: z.coerce.number().default(0),
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
    .array(
      z.object({
        date: z.string().date(),
        note: z.string(),
        source: z.enum(notesSource),
        minutesTaken: z.coerce.number().min(0),
      })
    )
    .default([]),
});

export const clientMetadataSchema = z.object({
  id: z.string(),
  dateOfBirth: z
    .union([z.string().date(), z.literal("Unknown")])
    .default("Unknown"),
  endDate: z.union([z.string().date(), z.literal("open")]).default("open"),
  details: basePersonDetails.omit({ address: true }).extend({
    customId: z.string().default(""),
    address: addressSchemaWithDeprivation,
    donationScheme: z.boolean().default(false),
    donationAmount: z.coerce.number().default(0),
    referredBy: z.string().default(""),
    clientAgreementDate: z
      .union([z.string().date(), z.literal("")])
      .default(""),
    clientAgreementComments: z.string().default(""),
    riskAssessmentDate: z.union([z.string().date(), z.literal("")]).default(""),
    riskAssessmentComments: z.string().default(""),
    attendanceAllowance: z.object({
      requestedLevel: z.enum(attendanceAllowanceLevels).default("None"),
      hoursToCompleteRequest: z.coerce.number().default(0),
      completedBy: z
        .object({
          id: z.string().default(""),
          name: z.string().default(""),
        })
        .default({ id: "", name: "" }),
      requestedDate: z.union([z.string().date(), z.literal("")]).default(""),
      status: z.enum(attendanceAllowanceStatuses).default("None"),
      confirmationDate: z.union([z.string().date(), z.literal("")]).default(""),
    }),
    endReason: z.enum(endReasons).default("None"), // should be required if endDate not open
  }),
  requests: z.array(requestMetadataSchema).default([]),
});

export const clientFullSchema = clientMetadataSchema.extend({
  requests: z.array(requestFullSchema).default([]),
  magLogs: z.array(magLogSchema).default([]),
});

export const mpMetadataSchema = z.object({
  id: z.string(),
  dateOfBirth: z.string().default(""),
  endDate: z.union([z.string().date(), z.literal("open")]).default("open"),
  dbsExpiry: z.union([z.string().date(), z.literal("")]).default(""),
  publicLiabilityExpiry: z
    .union([z.string().date(), z.literal("")])
    .default(""),
  trainingRecords: z.array(trainingRecordSchema).default([]),
  details: basePersonDetails.extend({
    capacity: z.string().default(""),
    dbsNumber: z.string().default(""),
    publicLiabilityNumber: z.string().default(""),
    startDate: z.union([z.string().date(), z.literal("")]).default(""),
  }),
  packages: z.array(packageSchema).default([]),
});

export const mpFullSchema = mpMetadataSchema.omit({ packages: true }).extend({
  requests: z.array(requestFullSchema).default([]),
});

export const volunteerMetadataSchema = mpMetadataSchema
  .omit({
    details: true,
  })
  .extend({
    details: basePersonDetails.extend({
      capacity: z.string().default(""),
      dbsNumber: z.string().default(""),
      publicLiabilityNumber: z.string().default(""),
      startDate: z.union([z.string().date(), z.literal("")]).default(""),
      role: z.enum(volunteerRoles).default("Volunteer"),
    }),
  });

export const volunteerFullSchema = volunteerMetadataSchema
  .omit({ packages: true })
  .extend({
    solePackages: z.array(solePackageSchema).default([]),
  })
  .extend({
    requests: z.array(requestFullSchema).default([]),
  });

export const attendanceAllowanceCrossSectionSchema = z.object({
  // need to infer not in receipt of AA if termination date given.
  overallInReceipt: z.object({
    totalRequested: z.coerce.number().default(0),
    totalRequestedHigh: z.coerce.number().min(0).default(0),
    totalReceiving: z.coerce.number().default(0),
    totalReceivingHigh: z.coerce.number().min(0).default(0),
    totalReceivingHighRequestedHigh: z.coerce.number().min(0).default(0),
    totalUnsent: z.coerce.number().min(0).default(0), // only needed in cross section
    totalPending: z.coerce.number().min(0).default(0), // only needed in cross section
  }),
  thisMonthConfirmed: z.object({
    totalRequested: z.coerce.number().default(0),
    totalRequestedHigh: z.coerce.number().min(0).default(0),
    totalReceiving: z.coerce.number().default(0),
    totalReceivingHigh: z.coerce.number().min(0).default(0),
    totalReceivingHighRequestedHigh: z.coerce.number().min(0).default(0),
  }),
});

export const attendanceAllowanceReportSchema = z.object({
  years: z.array(
    attendanceAllowanceCrossSectionSchema.shape.thisMonthConfirmed.extend({
      totalHours: z.coerce.number().default(0),
      year: z.coerce.number(),
      months: z.array(
        attendanceAllowanceCrossSectionSchema.shape.thisMonthConfirmed.extend({
          totalHours: z.coerce.number().default(0),
          month: z.coerce.number(),
        })
      ),
    })
  ),
});

export const crossSectionSchema = z.object({
  totalHours: z.coerce.number().default(0),
  localities: z
    .array(
      z.object({
        name: z.string(),
        services: z.array(
          z.object({
            name: z.enum(serviceOptions),
            totalHours: z.coerce.number().default(0),
          })
        ),
        totalHours: z.coerce.number().default(0),
      })
    )
    .default([]),
  services: z
    .array(
      z.object({
        name: z.enum(serviceOptions),
        totalHours: z.coerce.number().default(0),
      })
    )
    .default([]),
});

export const deprivationCrossSectionSchema = z.object({
  totalHours: z.coerce.number().default(0),
  deprivationCategories: z
    .array(
      z.object({
        name: z.string(), // "Health Only", "Income Only", "Both", "Neither"
        services: z.array(
          z.object({
            name: z.enum(serviceOptions),
            totalHours: z.coerce.number().default(0),
          })
        ),
        totalHours: z.coerce.number().default(0),
      })
    )
    .default([]),
  services: z
    .array(
      z.object({
        name: z.enum(serviceOptions),
        totalHours: z.coerce.number().default(0),
      })
    )
    .default([]),
});

export const reportMonthSchema = crossSectionSchema.extend({
  month: z.coerce.number(),
});

export const deprivationReportMonthSchema =
  deprivationCrossSectionSchema.extend({
    month: z.coerce.number(),
  });

export const reportYearSchema = crossSectionSchema.extend({
  year: z.coerce.number(),
  months: z.array(reportMonthSchema),
});

export const deprivationReportYearSchema = deprivationCrossSectionSchema.extend(
  {
    year: z.coerce.number(),
    months: z.array(deprivationReportMonthSchema),
  }
);

export const reportSchema = z.object({
  years: z.array(reportYearSchema),
});

export const deprivationReportSchema = z.object({
  years: z.array(deprivationReportYearSchema),
});

export type MpMetadata = z.infer<typeof mpMetadataSchema>;
export type MpFull = z.infer<typeof mpFullSchema>;
export type VolunteerMetadata = z.infer<typeof volunteerMetadataSchema>;
export type VolunteerFull = z.infer<typeof volunteerFullSchema>;
export type ClientMetadata = z.infer<typeof clientMetadataSchema>;
export type ClientFull = z.infer<typeof clientFullSchema>;
export type SolePackage = z.infer<typeof solePackageSchema>;
export type ReqPackage = z.infer<typeof reqPackageSchema>;
export type Package = SolePackage | ReqPackage;
export type MagLog = z.infer<typeof magLogSchema>;
export type RequestMetadata = z.infer<typeof requestMetadataSchema>;
export type RequestFull = z.infer<typeof requestFullSchema>;
export type TrainingRecord = z.infer<typeof trainingRecordSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type ViewConfig = z.infer<typeof viewConfigSchema>;
export type AttendanceAllowanceCrossSection = z.infer<
  typeof attendanceAllowanceCrossSectionSchema
>;
export type AttendanceAllowanceReport = z.infer<
  typeof attendanceAllowanceReportSchema
>;
export type CrossSection = z.infer<typeof crossSectionSchema>;
export type DeprivationCrossSection = z.infer<
  typeof deprivationCrossSectionSchema
>;
export type ReportMonth = z.infer<typeof reportMonthSchema>;
export type DeprivationReportMonth = z.infer<
  typeof deprivationReportMonthSchema
>;
export type ReportYear = z.infer<typeof reportYearSchema>;
export type DeprivationReportYear = z.infer<typeof deprivationReportYearSchema>;
export type Report = z.infer<typeof reportSchema>;
export type DeprivationReport = z.infer<typeof deprivationReportSchema>;
