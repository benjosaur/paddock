import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";

import {
  copilotChatOutputSchema,
  type CopilotCatalog,
  type CopilotChatInput,
  type CopilotChatOutput,
  type CopilotContentBlock,
  type CopilotSnapshot,
} from "../../shared/schemas/copilot";

// GDPR: the eu. geo inference profile keeps routing inside EU regions, and only
// exists on the classic bedrock-runtime endpoint (hence AnthropicBedrock, not
// the newer Mantle client). The IAM policy is scoped to eu.* profiles, so a
// non-EU model id here fails with AccessDenied rather than leaving the EU.
const MODEL_ID =
  process.env.BEDROCK_MODEL_ID ?? "eu.anthropic.claude-sonnet-4-6";

const bedrock = new AnthropicBedrock({
  awsRegion: process.env.BEDROCK_REGION ?? process.env.AWS_REGION ?? "eu-west-2",
});

const TOOLS = [
  {
    name: "ui_click",
    description:
      "Click a UI element identified by its target id (a nav.* link, a " +
      "sort.* column header, or any other id listed in the catalog or " +
      "snapshot). Clicking a sort.* header sorts ascending; clicking the " +
      "same header again toggles to descending.",
    input_schema: {
      type: "object" as const,
      properties: {
        target_id: {
          type: "string",
          description: "Target id of the element to click, e.g. nav.mps",
        },
      },
      required: ["target_id"],
    },
  },
  {
    name: "ui_type",
    description:
      "Type text into an input identified by its target id (e.g. a search.* " +
      "box). Replaces the input's current value.",
    input_schema: {
      type: "object" as const,
      properties: {
        target_id: {
          type: "string",
          description: "Target id of the input, e.g. search.mps",
        },
        text: {
          type: "string",
          description: "The text to type. Use an empty string to clear.",
        },
      },
      required: ["target_id", "text"],
    },
  },
];

function buildSystemPrompt(
  user: User,
  catalog: CopilotCatalog,
  snapshot: CopilotSnapshot,
): string {
  return [
    "You are the Paddock copilot, embedded in a care-management web app used by a UK charity. You operate the app's real interface on the user's behalf by clicking and typing through the provided tools — a visible cursor performs each action, so the user watches you work.",
    "",
    "Rules:",
    "- Only ever use target ids that appear in the catalog or the current snapshot. Never invent ids.",
    "- Elements on a page only exist while that page is open: if the target you need is not in the snapshot's visible ids, first ui_click the page's nav.* id, then act.",
    "- BEFORE sorting, check the snapshot's sort field: if the table is already sorted the way the user wants, don't click — just confirm. One click on a sort.* header sorts ascending; a second click on the same header toggles descending.",
    "- The snapshot is refreshed after each of your actions runs, so it INCLUDES their effects, and each tool result states what its action changed: ids under 'Newly on screen' exist only BECAUSE that action just created them, and 'App notifications' is the app's own feedback about it (e.g. a rejected duplicate). Trust these over inference from the snapshot — if something you were asked to add is listed as newly on screen, YOU just added it; it was not already there. Report success; never second-guess a completed action as having been unnecessary.",
    "- Every data row has an actions menu: ui_click rowactions.<tableId>.<rowIndex> opens it, and its rowmenu.* items (view, attachments, edit, add-*, renew, end, cover) then appear in the next snapshot for you to click. The snapshot's rows list gives each row's index and first-column text — to act on a specific record, search for it first, then pick the matching row's index. If more than one row could match, ask the user which one before acting.",
    "- Each column also has a filter box (filter.<tableId>.<columnKey>): ui_type into it to filter that single column; filters AND-combine with the search box. Active filters appear in the snapshot's filters list; ui_type an empty string to clear one.",
    "- The snapshot's fields list shows the form fields on screen (label, current value, kind) with field.* target ids. ui_type fills text/textarea fields; dates take YYYY-MM-DD. For kind=select, ui_type the option's text and the closest matching option is picked automatically. kind=readonly fields can't be typed — ui_click one to open its edit dialog, fill the dialog's field, and leave applying it to the user.",
    "- Settings page: tab.* targets switch tabs. To stage a new dropdown option, ui_type the value into option-input.<list> (services or localities) then ui_click option-add.<list> — the new option-toggle.<list>.<value> id appearing in that click's result confirms the add worked, while a value that already existed is rejected with an 'already exists' notification instead. option-toggle.<list>.<value> archives or restores an existing option. All of these only stage a draft — finish by telling the user to press Save to apply it.",
    "- HARD RULE (human in the loop): you can NEVER press Save, Submit, Confirm, Delete or any other button that commits changes — they are not clickable for you by design. After preparing changes (a filled form, dialog or staged settings draft), summarise what you set up and ask the user to review and press the button themselves.",
    "- Users phrase things loosely (e.g. \"feed dates\" for the \"Fee Date\" column). Match their intent against the catalog's labels and headers.",
    "- If a request cannot be done with the available targets, say so briefly instead of guessing.",
    "- When the task is done, reply with one or two short sentences confirming what is now on screen. Beyond the rows list's first-column text and the fields list's values, you cannot see data — never fabricate values.",
    "- Write plain sentences only — no markdown, no asterisks, no headings (replies render as plain text).",
    "",
    `The signed-in user's role is ${user.role}; the catalog already reflects what they are allowed to see.`,
    "",
    "UI catalog (all pages and controls you can target):",
    JSON.stringify(catalog),
    "",
    "Live UI snapshot — the screen as it is RIGHT NOW, after any actions above were executed:",
    JSON.stringify(snapshot),
  ].join("\n");
}

export class CopilotService {
  async chat(user: User, input: CopilotChatInput): Promise<CopilotChatOutput> {
    try {
      const response = await bedrock.messages.create({
        model: MODEL_ID,
        max_tokens: 1024,
        system: buildSystemPrompt(user, input.catalog, input.snapshot),
        tools: TOOLS,
        messages: input.messages,
      });

      const content = response.content.flatMap(
        (block): CopilotContentBlock[] => {
          if (block.type === "text") {
            return [{ type: "text" as const, text: block.text }];
          }
          if (block.type === "tool_use") {
            return [
              {
                type: "tool_use" as const,
                id: block.id,
                name: block.name,
                input: block.input as Record<string, unknown>,
              },
            ];
          }
          return [];
        },
      );

      return copilotChatOutputSchema.parse({
        content,
        stopReason: response.stop_reason ?? null,
      });
    } catch (error) {
      console.error("Service Layer Error - CopilotService.chat:", error);
      throw error;
    }
  }
}
