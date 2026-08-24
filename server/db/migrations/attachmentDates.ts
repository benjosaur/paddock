import { ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { client } from "../repository";

// One-off backfill for the mandatory attachment `date` field (2026-08):
// sets date = the updatedAt day on every att# row that lacks one. Idempotent
// (attribute_not_exists guard), re-runnable, safe to run early. Must run on a
// table BEFORE a server requiring `date` is deployed against it — see the
// deploy-order note in the introducing commit. Delete once every table
// (WiveyCares2, Test2, *-Staging, local) is migrated.
//
//   bun run db.ts migrate:attachment-dates <tableName> [--dry-run]
//
// Uses the shared document client: DynamoDB Local when NODE_ENV != production,
// AWS credentials from the environment otherwise.
export async function runAttachmentDatesMigration(
  tableName: string,
  options: { dryRun: boolean }
): Promise<void> {
  console.log(
    `${options.dryRun ? "[dry-run] " : ""}Backfilling attachment dates in "${tableName}"...`
  );

  let matched = 0;
  let updated = 0;
  let skipped = 0;
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const page = await client.send(
      new ScanCommand({
        TableName: tableName,
        // #date: `date` is a DynamoDB reserved word.
        FilterExpression:
          "begins_with(sK, :att) AND attribute_not_exists(#date)",
        ExpressionAttributeNames: { "#date": "date" },
        ExpressionAttributeValues: { ":att": "att#" },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );
    lastEvaluatedKey = page.LastEvaluatedKey;

    for (const item of page.Items ?? []) {
      matched++;
      const { pK, sK, updatedAt } = item;
      if (typeof updatedAt !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(updatedAt)) {
        skipped++;
        console.warn(`  SKIP ${pK} ${sK}: unusable updatedAt ${String(updatedAt)}`);
        continue;
      }
      const date = updatedAt.slice(0, 10);
      if (options.dryRun) {
        console.log(`  would set ${pK} ${sK} date=${date}`);
        continue;
      }
      try {
        await client.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { pK, sK },
            UpdateExpression: "SET #date = :d",
            // Never overwrite a date written since the scan (or by a re-run).
            ConditionExpression: "attribute_not_exists(#date)",
            ExpressionAttributeNames: { "#date": "date" },
            ExpressionAttributeValues: { ":d": date },
          })
        );
        updated++;
        console.log(`  set ${pK} ${sK} date=${date}`);
      } catch (error) {
        if ((error as { name?: string }).name === "ConditionalCheckFailedException") {
          skipped++;
          console.warn(`  SKIP ${pK} ${sK}: date appeared concurrently`);
          continue;
        }
        throw error;
      }
    }
  } while (lastEvaluatedKey);

  console.log(
    `Done: ${matched} undated att# row(s) found, ${updated} updated, ${skipped} skipped${
      options.dryRun ? " (dry-run: no writes)" : ""
    }.`
  );
}
