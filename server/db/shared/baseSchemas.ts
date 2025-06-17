import { z } from "zod";

export const isoDate = z.string().datetime();
export const stringList = z.array(z.string());
export const floatString = z
  .string()
  .regex(/^\d+(\.\d+)?$/, "Expected a float string");

export const baseDetailsSchema = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string().optional(),
  email: z.string().optional(),
  nextOfKin: z.string().optional(),
  needs: stringList.optional(),
  services: stringList.optional(),
  notes: z.string().optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
  updatedBy: isoDate,
});
