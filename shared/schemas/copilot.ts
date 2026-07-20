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

// A tool_result's content is a CopilotActionReport serialised as JSON. The
// client executor builds it against this schema and the server prompt
// documents each field from copilotReportFieldDocs, so the model-facing
// contract lives in this one file (the `satisfies` below keeps schema and
// docs from drifting apart).
export const copilotNotificationSchema = z.object({
  severity: z.enum(["success", "error", "notice"]),
  text: z.string(),
});

export const copilotActionReportSchema = z.object({
  ok: z.boolean(),
  action: z.enum(["click", "type"]),
  target: z.string(),
  error: z.string().optional(),
  value: z.string().optional(),
  state: z.object({
    path: z.string(),
    sort: z.string(),
    dialogOpen: z.boolean(),
  }),
  appeared: z.array(z.string()),
  disappeared: z.array(z.string()),
  notifications: z.array(copilotNotificationSchema),
});

export type CopilotNotification = z.infer<typeof copilotNotificationSchema>;
export type CopilotActionReport = z.infer<typeof copilotActionReportSchema>;

export const copilotReportFieldDocs = {
  ok: "true when the action executed; false means it could not run (see error)",
  action: "click or type",
  target: "the target id acted on",
  error: "why the action could not run (only when ok is false)",
  value: "the field's value after typing (type actions only)",
  state: "UI state after the action: path, sort, dialogOpen",
  appeared:
    "target ids visible after the action but not before (list may end with '+N more'). An action that REVEALS content (navigating, switching tabs, opening a menu or dialog) shows EXISTING things — only a creation action (e.g. option-add) actually created what appeared",
  disappeared: "target ids visible before the action but not after",
  notifications:
    "app notifications (toasts) raised while the action ran, as severity + text. Usually caused by this very action, but a slow effect of an earlier action or the user acting in parallel can also produce one",
} as const satisfies Record<keyof CopilotActionReport, string>;

export const copilotContentBlockSchema = z.discriminatedUnion("type", [
  copilotTextBlockSchema,
  copilotToolUseBlockSchema,
  copilotToolResultBlockSchema,
]);

// Hard cap on blocks per message. The service clamps model output to this
// before returning it, because the client replays every returned message
// back through this schema — an oversized message would otherwise fail
// validation on all subsequent requests.
export const COPILOT_MAX_CONTENT_BLOCKS = 24;

export const copilotMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z
    .array(copilotContentBlockSchema)
    .min(1)
    .max(COPILOT_MAX_CONTENT_BLOCKS),
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

// A visible table row: index (used in rowactions.<tableId>.<index> targets)
// plus its first-column text so the model can pick the right record.
export const copilotRowSchema = z.object({
  index: z.number().int().min(0),
  label: z.string(),
});

// A form field currently on screen, addressable as field.<slug> targets.
export const copilotFieldSchema = z.object({
  targetId: z.string(),
  label: z.string(),
  value: z.string(),
  kind: z.string(),
});

// An active per-column filter (only non-empty ones are reported).
export const copilotFilterSchema = z.object({
  targetId: z.string(),
  value: z.string(),
});

export const copilotSnapshotSchema = z.object({
  path: z.string(),
  visibleTargetIds: z.array(z.string()).max(200),
  sort: copilotSortStateSchema.nullable(),
  searchTerm: z.string().default(""),
  rows: z.array(copilotRowSchema).max(40).default([]),
  fields: z.array(copilotFieldSchema).max(80).default([]),
  filters: z.array(copilotFilterSchema).max(30).default([]),
});

export const copilotChatInputSchema = z.object({
  // A maximal run sends 1 + 2 * RUNAWAY_TURN_LIMIT messages (useCopilot.ts);
  // keep this cap above that or long runs die on input validation.
  messages: z.array(copilotMessageSchema).min(1).max(120),
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
export type CopilotRow = z.infer<typeof copilotRowSchema>;
export type CopilotField = z.infer<typeof copilotFieldSchema>;
export type CopilotFilter = z.infer<typeof copilotFilterSchema>;
export type CopilotSnapshot = z.infer<typeof copilotSnapshotSchema>;
export type CopilotChatInput = z.infer<typeof copilotChatInputSchema>;
export type CopilotChatOutput = z.infer<typeof copilotChatOutputSchema>;
