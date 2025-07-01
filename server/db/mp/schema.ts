import { z } from "zod";
import { mpMetadataSchema } from "shared";
import { dbTrainingRecordEntity } from "../training/schema";

export const dbMpEntity = mpMetadataSchema
  .omit({
    id: true,
    trainingRecords: true,
  })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("mp"),
    entityOwner: z.literal("mp"),
  });

export const dbMpTrainingRecordEntity = dbTrainingRecordEntity
  .omit({
    entityOwner: true,
  })
  .extend({
    entityOwner: z.literal("mp"),
  });

export const dbMpMetadata = z.union([dbMpEntity, dbMpTrainingRecordEntity]);

export const dbMpLogEntity = z.object({
  pK: z.string(),
  sK: z.string(),
  entityOwner: z.literal("mp"),
  entityType: z.literal("mpLog"),
  date: z.string(),
  details: z.object({ name: z.string(), notes: z.string().default("") }),
});

export const dbMpFull = z.union([dbMpMetadata, dbMpLogEntity]);

export type DbMpMetadata = z.infer<typeof dbMpMetadata>;
export type DbMpEntity = z.infer<typeof dbMpEntity>;
export type DbMpTrainingRecordEntity = z.infer<typeof dbMpTrainingRecordEntity>;
export type DbMpLogEntity = z.infer<typeof dbMpLogEntity>;
export type DbMpFull = z.infer<typeof dbMpFull>;
