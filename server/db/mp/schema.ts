import { z } from "zod";
import { mpMetadataSchema } from "shared";
import { dbTrainingRecordEntity } from "../training/schema";
import { dbMpLogMp } from "../mplog/schema";

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

export const dbMpFull = z.union([dbMpMetadata, dbMpLogMp]);

export type DbMpMetadata = z.infer<typeof dbMpMetadata>;
export type DbMpEntity = z.infer<typeof dbMpEntity>;
export type DbMpTrainingRecordEntity = z.infer<typeof dbMpTrainingRecordEntity>;
export type DbMpFull = z.infer<typeof dbMpFull>;
