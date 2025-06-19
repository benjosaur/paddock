import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const rawClient = new DynamoDBClient({
  region: "eu-west-2",
  endpoint: "http://localhost:8000",
  credentials: {
    accessKeyId: "dummy",
    secretAccessKey: "dummy",
  },
});

// Create DynamoDB Document client for easier operations
export const client = DynamoDBDocumentClient.from(rawClient);

export const TABLE_NAME = "WiveyCares";

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
