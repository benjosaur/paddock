// Sanitises arbitrary text (record ids, option values, labels) into a
// copilot target-id segment matching the executor's /^[\w.-]+$/ grammar.
// Lowercases, collapses runs of other characters to "-", trims edge dashes.
export function copilotIdSegment(text: string, maxLength = 40): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength);
}
