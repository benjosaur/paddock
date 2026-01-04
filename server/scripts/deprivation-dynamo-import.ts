import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceNotFoundException,
} from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_INPUT = path.resolve(
  __dirname,
  "../services/deprivation-compact.csv"
);
const DEFAULT_TABLE = "DeprivationCompact";
const DEFAULT_REGION = process.env.AWS_REGION ?? "eu-west-2";
const BATCH_SIZE = 25;

type ImportConfig = {
  inputPath: string;
  tableName: string;
  region: string;
  endpoint?: string;
  createTable: boolean;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizePostcode(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

async function ensureTable(
  client: DynamoDBClient,
  tableName: string,
  createTable: boolean
) {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return;
  } catch (error) {
    if (
      error instanceof ResourceNotFoundException ||
      (error as { name?: string }).name === "ResourceNotFoundException"
    ) {
      if (!createTable) {
        throw new Error(
          `Table ${tableName} does not exist and createTable=false.`
        );
      }

      await client.send(
        new CreateTableCommand({
          TableName: tableName,
          AttributeDefinitions: [
            { AttributeName: "postcode", AttributeType: "S" },
          ],
          KeySchema: [{ AttributeName: "postcode", KeyType: "HASH" }],
          BillingMode: "PAY_PER_REQUEST",
        })
      );

      // Wait for ACTIVE
      for (let i = 0; i < 20; i++) {
        const status = await client.send(
          new DescribeTableCommand({ TableName: tableName })
        );
        if (status.Table?.TableStatus === "ACTIVE") return;
        await sleep(1500);
      }

      throw new Error(`Table ${tableName} not ACTIVE after wait.`);
    }

    throw error;
  }
}

async function flushBatch(
  docClient: DynamoDBDocumentClient,
  tableName: string,
  batch: Array<{ PutRequest: { Item: Record<string, unknown> } }>
) {
  if (batch.length === 0) return;

  let pending: Record<string, typeof batch> = {
    [tableName]: batch,
  };

  while (Object.keys(pending).length > 0) {
    const response = await docClient.send(
      new BatchWriteCommand({ RequestItems: pending })
    );
    const unprocessed = response.UnprocessedItems ?? {};
    if (Object.keys(unprocessed).length === 0) break;
    pending = unprocessed;
    await sleep(200);
  }
}

export async function runImport(
  configOverride: Partial<ImportConfig> = {}
): Promise<void> {
  const config: ImportConfig = {
    inputPath: configOverride.inputPath
      ? path.resolve(configOverride.inputPath)
      : DEFAULT_INPUT,
    tableName: configOverride.tableName ?? DEFAULT_TABLE,
    region: configOverride.region ?? DEFAULT_REGION,
    endpoint: configOverride.endpoint,
    createTable: configOverride.createTable ?? false,
  };

  if (!fs.existsSync(config.inputPath)) {
    throw new Error(`Input CSV not found at ${config.inputPath}`);
  }

  const baseClient = new DynamoDBClient({
    region: config.region,
    endpoint: config.endpoint,
  });
  const docClient = DynamoDBDocumentClient.from(baseClient, {
    marshallOptions: { removeUndefinedValues: true },
  });

  await ensureTable(baseClient, config.tableName, config.createTable);

  const stream = fs.createReadStream(config.inputPath, { encoding: "utf-8" });
  const reader = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  let headerParsed = false;
  let total = 0;
  let written = 0;
  let batch: Array<{ PutRequest: { Item: Record<string, unknown> } }> = [];

  for await (const rawLine of reader) {
    const line = rawLine.trimEnd();
    if (!line) continue;

    if (!headerParsed) {
      headerParsed = true; // skip header
      continue;
    }

    const [postcodeRaw, incomeRaw, healthRaw] = parseCsvLine(line);
    if (!postcodeRaw || incomeRaw === undefined || healthRaw === undefined) {
      continue;
    }

    const postcode = normalizePostcode(postcodeRaw);
    const incomeDecile = Number(incomeRaw);
    const healthDecile = Number(healthRaw);

    if (!postcode) continue;
    if (Number.isNaN(incomeDecile) || Number.isNaN(healthDecile)) continue;

    total += 1;

    batch.push({
      PutRequest: {
        Item: { postcode, incomeDecile, healthDecile },
      },
    });

    if (batch.length === BATCH_SIZE) {
      await flushBatch(docClient, config.tableName, batch);
      written += batch.length;
      batch = [];
    }
  }

  if (batch.length > 0) {
    await flushBatch(docClient, config.tableName, batch);
    written += batch.length;
  }

  console.log(
    `Imported ${written} rows into ${config.tableName} from ${config.inputPath} (read ${total} data rows).`
  );
}

