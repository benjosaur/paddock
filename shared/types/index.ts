import { z } from "zod";
import {
  mpSchema,
  volunteerSchema,
  clientSchema,
  mpLogSchema,
  volunteerLogSchema,
  magLogSchema,
  clientRequestSchema,
  trainingRecordItemSchema,
  userRoleSchema,
  viewConfigSchema,
  expiryItemSchema,
  createMpSchema,
  createVolunteerSchema,
  createClientSchema,
  createMpLogSchema,
  createVolunteerLogSchema,
  createMagLogSchema,
  createClientRequestSchema,
} from "../schemas";

export type Mp = z.infer<typeof mpSchema>;
export type Volunteer = z.infer<typeof volunteerSchema>;
export type Client = z.infer<typeof clientSchema>;
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
