import { z } from "zod";

export const trainingRecordItemSchema = z.object({
  training: z.string(),
  expiry: z.string(),
});

export const userRoleSchema = z.enum([
  "Admin",
  "Trustee",
  "Coordinator",
  "Fundraiser",
]);

export const viewConfigSchema = z.object({
  role: userRoleSchema,
  availableViews: z.array(z.string()),
});

export const expiryItemSchema = z.object({
  id: z.string(),
  date: z.string(),
  type: z.enum(["training", "dbs"]),
  mpVolunteer: z.string(),
  name: z.string(),
  personType: z.enum(["MP", "Volunteer"]),
});

export const mpSchema = z.object({
  id: z.string(),
  name: z.string(),
  dob: z.string().optional(),
  address: z.string(),
  postCode: z.string(),
  phone: z.string(),
  email: z.string().email(),
  nextOfKin: z.string(),
  dbsNumber: z.string().optional(),
  dbsExpiry: z.string(),
  servicesOffered: z.array(z.string()),
  specialisms: z.array(z.string()),
  transport: z.string(),
  capacity: z.string(),
  trainingRecords: z.array(trainingRecordItemSchema),
});

export const volunteerSchema = z.object({
  id: z.string(),
  name: z.string(),
  dob: z.string().optional(),
  address: z.string(),
  postCode: z.string(),
  phone: z.string(),
  email: z.string().email(),
  nextOfKin: z.string(),
  dbsNumber: z.string().optional(),
  dbsExpiry: z.string().optional(),
  servicesOffered: z.array(z.string()),
  needTypes: z.array(z.string()),
  transport: z.string(),
  capacity: z.string(),
  specialisms: z.array(z.string()).optional(),
  trainingRecords: z.array(trainingRecordItemSchema),
});

export const clientSchema = z.object({
  id: z.string(),
  name: z.string(),
  dob: z.string(),
  address: z.string(),
  postCode: z.string(),
  phone: z.string(),
  email: z.string().email(),
  nextOfKin: z.string(),
  referredBy: z.string(),
  clientAgreementDate: z.string().optional(),
  clientAgreementComments: z.string().optional(),
  riskAssessmentDate: z.string().optional(),
  riskAssessmentComments: z.string().optional(),
  needs: z.array(z.string()),
  servicesProvided: z.array(z.string()),
  hasMp: z.boolean().optional(),
  hasAttendanceAllowance: z.boolean().optional(),
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
  requestType: z.enum(["paid", "volunteer"]),
  startDate: z.string(),
  schedule: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
});

export const createMpSchema = mpSchema.omit({ id: true });
export const createVolunteerSchema = volunteerSchema.omit({ id: true });
export const createClientSchema = clientSchema.omit({ id: true });
export const createMpLogSchema = mpLogSchema.omit({ id: true });
export const createVolunteerLogSchema = volunteerLogSchema.omit({ id: true });
export const createMagLogSchema = magLogSchema.omit({ id: true });
export const createClientRequestSchema = clientRequestSchema.omit({ id: true });

export const updateMpSchema = mpSchema.partial().extend({ id: z.string() });
export const updateVolunteerSchema = volunteerSchema
  .partial()
  .extend({ id: z.string() });
export const updateClientSchema = clientSchema
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
