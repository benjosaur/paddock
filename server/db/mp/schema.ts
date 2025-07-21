import { z } from "zod";
import { mpMetadataSchema } from "shared";
import { dbTrainingRecord } from "../training/schema";
import { dbPackage } from "../package/schema";
import { dbMagLogMp } from "../mag/schema";

export const dbMpEntity = mpMetadataSchema
  .omit({
    id: true,
    trainingRecords: true,
  })
  .extend({
    pK: z.string(),
    sK: z.string(),
    entityType: z.literal("mp"),
  });

export const dbMpMetadata = z.union([dbMpEntity, dbTrainingRecord]);

export const dbMpFull = z.union([dbMpMetadata, dbPackage, dbMagLogMp]);

export type DbMpMetadata = z.infer<typeof dbMpMetadata>;
export type DbMpEntity = z.infer<typeof dbMpEntity>;
export type DbMpFull = z.infer<typeof dbMpFull>;
