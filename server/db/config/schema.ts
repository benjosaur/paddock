import { optionListSchema, tableColumnConfigSchema } from "shared";
import { z } from "zod";
import { dbEntrySchema } from "../schema";

const dbConfigBase = dbEntrySchema.extend({
  pK: z.literal("config"),
  entityType: z.literal("config"),
});

export const dbOptionListItem = dbConfigBase.extend({
  sK: z.enum(["services", "localities"]),
  data: optionListSchema,
});

export const dbTableColumnsItem = dbConfigBase.extend({
  sK: z.literal("tableColumns"),
  data: tableColumnConfigSchema,
});

export const dbConfigItem = z.union([dbOptionListItem, dbTableColumnsItem]);

export type DbConfigItem = z.infer<typeof dbConfigItem>;
