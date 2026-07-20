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
const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? "eu.anthropic.claude-opus-4-8";

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
    "- The snapshot shows the current sort state. One click on a sort.* header sorts ascending; a second click on the same header toggles descending. Do not click again if the table is already sorted the way the user wants.",
    "- Users phrase things loosely (e.g. \"feed dates\" for the \"Fee Date\" column). Match their intent against the catalog's labels and headers.",
    "- If a request cannot be done with the available targets, say so briefly instead of guessing.",
    "- When the task is done, reply with one or two short sentences confirming what is now on screen. Never fabricate data values — you can only see structure, not table contents.",
    "",
    `The signed-in user's role is ${user.role}; the catalog already reflects what they are allowed to see.`,
    "",
    "UI catalog (all pages and controls you can target):",
    JSON.stringify(catalog),
    "",
    "Current UI snapshot:",
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
