// in repository schemas use default("") instead of shared nullable(), to give values to all optional fields.
// but on way in these need to be stripped so drop null fields after parsing.

import { DynamoDB, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { isProd } from "..";

const createRawClient = (): DynamoDBClient => {
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

export function addCreateMiddleware<T>(
  input: T,
  user: User
): T & { createdAt: string; updatedAt: string; updatedBy: string } {
  const now = new Date().toISOString();
  return dropNullFields({
    ...input,
    createdAt: now,
    updatedAt: now,
    updatedBy: user.sub,
  });
}

export function addUpdateMiddleware<T>(
  input: T,
  user: User
): T & { updatedAt: string; updatedBy: string } {
  const now = new Date().toISOString();
  return dropNullFields({
    ...input,
    updatedAt: now,
    updatedBy: user.sub,
  });
}

function dropNullFields<T>(input: T): T {
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
