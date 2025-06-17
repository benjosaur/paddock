import { z } from "zod";
import { trainingRecordSchema, trainingRecordArraySchema } from "./schema";

export type TrainingRecord = z.infer<typeof trainingRecordSchema>;
export type TrainingRecordArray = z.infer<typeof trainingRecordArraySchema>;
