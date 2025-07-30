// in repository schemas use default("") instead of shared nullable(), to give values to all optional fields.
// but on way in these need to be stripped so drop null fields after parsing.

import { DynamoDB, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";

const createRawClient = (): DynamoDBClient => {
  const isProd = process.env.NODE_ENV == "production";
  if (isProd) {
    return new DynamoDB();
  }

  return new DynamoDBClient({
    region: "eu-west-2",
    endpoint: "http://localhost:8000",
    credentials: {
      accessKeyId: "dummy",
      secretAccessKey: "dummy",
    },
  });
};

export const getTableName = (user: User): string => {
  const allowedGroups = ["Admin", "Coordinator", "Trustee", "Finance"];
  if (allowedGroups.find((group) => user.role == group)) {
    return "WiveyCares";
  }
  return "Test";
};

export const client = DynamoDBDocumentClient.from(createRawClient());

export function dropNullFields<T>(input: T): T {
  if (Array.isArray(input)) {
    return input
      .map(dropNullFields)
      .filter(
        (value) => value !== "" && value !== null && value !== undefined
      ) as T;
  } else if (typeof input === "object" && input !== null) {
    const result = {} as any;
    for (const [key, value] of Object.entries(input)) {
      const cleanedValue = dropNullFields(value);
      if (
        cleanedValue !== "" &&
        cleanedValue !== null &&
        cleanedValue !== undefined
      ) {
        result[key] = cleanedValue;
      }
    }
    return result as T;
  }
  return input;
}

export async function genericUpdate<
  T extends { updatedBy: string; updatedAt: string }
>(items: T[], user: User): Promise<void> {
  // only for use when input validation is intentioanlly agnostic and not necessary
  const tableName = getTableName(user);

  // DynamoDB batch write can handle up to 25 items at a time
  const batchSize = 25;
  const batches = [];

  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    const requestItems = {
      [tableName]: batch.map((item) => ({
        PutRequest: {
          Item: item,
        },
      })),
    };

    const command = new BatchWriteCommand({
      RequestItems: requestItems,
    });

    try {
      await client.send(command);
    } catch (error) {
      console.error("Repository Layer Error in generic update:", error);
      throw error;
    }
  }
}
