import { z } from "zod";
import { configurableTableIds } from "../const";

// The copilot round-trips a subset of the Anthropic Messages wire shape
// between client and Bedrock: the client keeps the conversation (including
// tool_use blocks it executed) and replays it on every request, so the
// server can stay stateless.

export const copilotToolNames = ["ui_click", "ui_type"] as const;

export const copilotTextBlockSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

// Tool inputs are model-generated; keep validation loose and let the client
// executor reject anything unusable with an is_error tool_result.
export const copilotToolUseBlockSchema = z.object({
  type: z.literal("tool_use"),
  id: z.string(),
  name: z.string(),
  input: z
    .object({
      target_id: z.string().optional(),
      text: z.string().optional(),
    })
    .passthrough(),
});

export const copilotToolResultBlockSchema = z.object({
  type: z.literal("tool_result"),
  tool_use_id: z.string(),
  content: z.string(),
  is_error: z.boolean().optional(),
});

export const copilotContentBlockSchema = z.discriminatedUnion("type", [
  copilotTextBlockSchema,
  copilotToolUseBlockSchema,
  copilotToolResultBlockSchema,
]);

export const copilotMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.array(copilotContentBlockSchema).min(1).max(24),
});

// Catalog: everything the model may target, built client-side per request so
// it always reflects the user's role and the org's column config.
export const copilotPageSchema = z.object({
  key: z.string(),
  label: z.string(),
  path: z.string(),
  navTargetId: z.string(),
  description: z.string().default(""),
});

export const copilotColumnSchema = z.object({
  key: z.string(),
  header: z.string(),
  sortTargetId: z.string(),
});

export const copilotTableSchema = z.object({
  tableId: z.enum(configurableTableIds),
  label: z.string(),
  pageKey: z.string(),
  searchTargetId: z.string(),
  columns: z.array(copilotColumnSchema).max(30),
});

export const copilotCatalogSchema = z.object({
  pages: z.array(copilotPageSchema).max(30),
  tables: z.array(copilotTableSchema).max(10),
});

// Snapshot: what is actually on screen right now, rebuilt after every action.
export const copilotSortStateSchema = z.object({
  tableId: z.enum(configurableTableIds),
  columnKey: z.string(),
  direction: z.enum(["asc", "desc"]),
});

export const copilotSnapshotSchema = z.object({
  path: z.string(),
  visibleTargetIds: z.array(z.string()).max(200),
  sort: copilotSortStateSchema.nullable(),
  searchTerm: z.string().default(""),
});

export const copilotChatInputSchema = z.object({
  messages: z.array(copilotMessageSchema).min(1).max(40),
  catalog: copilotCatalogSchema,
  snapshot: copilotSnapshotSchema,
});

// Assistant turns only ever contain text/tool_use blocks; the service filters
// the Bedrock response down to this shape.
export const copilotChatOutputSchema = z.object({
  content: z.array(copilotContentBlockSchema),
  stopReason: z.string().nullable(),
});

export type CopilotToolName = (typeof copilotToolNames)[number];
export type CopilotTextBlock = z.infer<typeof copilotTextBlockSchema>;
export type CopilotToolUseBlock = z.infer<typeof copilotToolUseBlockSchema>;
export type CopilotToolResultBlock = z.infer<
  typeof copilotToolResultBlockSchema
>;
export type CopilotContentBlock = z.infer<typeof copilotContentBlockSchema>;
export type CopilotMessage = z.infer<typeof copilotMessageSchema>;
export type CopilotPage = z.infer<typeof copilotPageSchema>;
export type CopilotColumn = z.infer<typeof copilotColumnSchema>;
export type CopilotTable = z.infer<typeof copilotTableSchema>;
export type CopilotCatalog = z.infer<typeof copilotCatalogSchema>;
export type CopilotSortState = z.infer<typeof copilotSortStateSchema>;
export type CopilotSnapshot = z.infer<typeof copilotSnapshotSchema>;
export type CopilotChatInput = z.infer<typeof copilotChatInputSchema>;
export type CopilotChatOutput = z.infer<typeof copilotChatOutputSchema>;
