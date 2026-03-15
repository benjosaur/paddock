/**
 * Deprivation data migration.
 *
 * Scans the main DynamoDB table for all entities that have a
 * `details.address.postCode` field (clients, requests, req-packages) and
 * re-derives the `details.address.deprivation` flags using the current
 * DeprivationCompact lookup table (2025 data).
 *
 * Defaults to DRY_RUN=true. Set DRY_RUN=false to write changes.
 *
 * Local:  bun run scripts/migrate-deprivation-remote.ts
 * Remote: NODE_ENV=production bun run scripts/migrate-deprivation-remote.ts
 *         NODE_ENV=production DRY_RUN=false bun run scripts/migrate-deprivation-remote.ts
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

import { DEPRIVATION_THRESHOLD_DECILE } from "../../shared/const";

const MAIN_TABLE = process.env.MAIN_TABLE ?? "WiveyCares2";
const DEPRIVATION_TABLE = process.env.DEPRIVATION_TABLE ?? "DeprivationCompact";
const DRY_RUN = process.env.DRY_RUN !== "false";

function normalizePostcode(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

function createDocClient(): DynamoDBDocumentClient {
  const isProd = process.env.NODE_ENV === "production";
  const region = process.env.AWS_REGION ?? "eu-west-2";
  const rawClient = isProd
    ? new DynamoDBClient({ region })
    : new DynamoDBClient({
        region,
        endpoint: "http://localhost:8000",
        credentials: { accessKeyId: "dummy", secretAccessKey: "dummy" },
      });
  return DynamoDBDocumentClient.from(rawClient, {
    marshallOptions: { removeUndefinedValues: true },
  });
}

async function getNewDeprivation(
  docClient: DynamoDBDocumentClient,
  postCode: string
): Promise<{ income: boolean; health: boolean }> {
  const normalized = normalizePostcode(postCode);
  if (!normalized) return { income: false, health: false };

  const result = await docClient.send(
    new GetCommand({
      TableName: DEPRIVATION_TABLE,
      Key: { postcode: normalized },
    })
  );

  if (result.Item) {
    const incomeDecile = Number(result.Item.incomeDecile);
    const healthDecile = Number(result.Item.healthDecile);
    if (!Number.isNaN(incomeDecile) && !Number.isNaN(healthDecile)) {
      return {
        income: incomeDecile <= DEPRIVATION_THRESHOLD_DECILE,
        health: healthDecile <= DEPRIVATION_THRESHOLD_DECILE,
      };
    }
  }

  // Fallback: try raw uppercase with space (in case data was stored un-normalized)
  const rawKey = postCode.toUpperCase().trim();
  if (rawKey !== normalized) {
    const fallback = await docClient.send(
      new GetCommand({
        TableName: DEPRIVATION_TABLE,
        Key: { postcode: rawKey },
      })
    );
    if (fallback.Item) {
      const incomeDecile = Number(fallback.Item.incomeDecile);
      const healthDecile = Number(fallback.Item.healthDecile);
      if (!Number.isNaN(incomeDecile) && !Number.isNaN(healthDecile)) {
        return {
          income: incomeDecile <= DEPRIVATION_THRESHOLD_DECILE,
          health: healthDecile <= DEPRIVATION_THRESHOLD_DECILE,
        };
      }
    }
  }

  return { income: false, health: false };
}

export async function runMigration(): Promise<void> {
  const docClient = createDocClient();

  console.log(
    `Deprivation migration | table=${MAIN_TABLE} | depriv_table=${DEPRIVATION_TABLE} | DRY_RUN=${DRY_RUN}`
  );
  if (DRY_RUN) {
    console.log(
      "DRY RUN — no writes will be made. Set DRY_RUN=false to apply changes."
    );
  }

  let lastKey: Record<string, unknown> | undefined = undefined;
  let scanned = 0;
  let updated = 0;
  let noPostcode = 0;
  let errors = 0;

  do {
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: MAIN_TABLE,
        FilterExpression:
          "attribute_exists(details.#addr.#pc) AND details.#addr.#pc <> :empty",
        ExpressionAttributeNames: {
          "#addr": "address",
          "#pc": "postCode",
        },
        ExpressionAttributeValues: {
          ":empty": "",
        },
        ExclusiveStartKey: lastKey,
      })
    );

    for (const item of scanResult.Items ?? []) {
      const postCode = item.details?.address?.postCode as string | undefined;
      if (!postCode) {
        noPostcode++;
        continue;
      }

      scanned++;

      try {
        const newDeprivation = await getNewDeprivation(docClient, postCode);
        const oldDeprivation = item.details?.address?.deprivation;

        const changed =
          !oldDeprivation ||
          oldDeprivation.income !== newDeprivation.income ||
          oldDeprivation.health !== newDeprivation.health;

        console.log(
          `[${item.pK} / ${item.sK}] ${postCode}: ${JSON.stringify(oldDeprivation)} -> ${JSON.stringify(newDeprivation)}${changed ? " *" : ""}`
        );

        if (!DRY_RUN) {
          await docClient.send(
            new UpdateCommand({
              TableName: MAIN_TABLE,
              Key: { pK: item.pK, sK: item.sK },
              UpdateExpression: "SET details.#addr.#dep = :deprivation",
              ExpressionAttributeNames: {
                "#addr": "address",
                "#dep": "deprivation",
              },
              ExpressionAttributeValues: {
                ":deprivation": newDeprivation,
              },
            })
          );
        }

        updated++;
      } catch (err) {
        console.error(`Error processing ${item.pK} / ${item.sK}:`, err);
        errors++;
      }
    }

    lastKey = scanResult.LastEvaluatedKey as
      | Record<string, unknown>
      | undefined;
  } while (lastKey);

  console.log(
    `\nComplete. scanned=${scanned}, ${DRY_RUN ? "would_update" : "updated"}=${updated}, no_postcode_skipped=${noPostcode}, errors=${errors}`
  );
}
