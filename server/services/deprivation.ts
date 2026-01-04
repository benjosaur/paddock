import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

import { DEPRIVATION_THRESHOLD_DECILE } from "../../shared/const";

interface DeprivationData {
  matched: boolean;
  income: boolean;
  health: boolean;
}

type DeprivationRecord = {
  incomeDecile: number;
  healthDecile: number;
};

type DeprivationServiceOptions = {
  tableName?: string;
  dynamo?: DynamoDBDocumentClient;
  staticData?: Map<string, DeprivationRecord>; // for tests or fallback
};

const DEFAULT_TABLE = process.env.DEPRIVATION_TABLE ?? "DeprivationCompact";

function normalizePostcode(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export class DeprivationService {
  private readonly tableName: string;
  private readonly dynamo?: DynamoDBDocumentClient;
  private readonly staticData?: Map<string, DeprivationRecord>;

  constructor(options: DeprivationServiceOptions = {}) {
    this.tableName = options.tableName ?? DEFAULT_TABLE;
    this.staticData = options.staticData;
    this.dynamo =
      options.dynamo ??
      DynamoDBDocumentClient.from(
        new DynamoDBClient({
          region: process.env.AWS_REGION ?? "eu-west-2",
        }),
        { marshallOptions: { removeUndefinedValues: true } }
      );
  }

  private async getFromStore(
    postcode: string
  ): Promise<DeprivationRecord | undefined> {
    if (this.staticData) {
      return this.staticData.get(postcode);
    }

    if (!this.dynamo) {
      throw new Error("DynamoDB client not configured");
    }

    const result = await this.dynamo.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { postcode },
      })
    );

    if (!result.Item) return undefined;

    const incomeDecile = Number(result.Item.incomeDecile);
    const healthDecile = Number(result.Item.healthDecile);

    if (Number.isNaN(incomeDecile) || Number.isNaN(healthDecile)) {
      return undefined;
    }

    return { incomeDecile, healthDecile };
  }

  async getDeprivationData(postcode: string): Promise<DeprivationData> {
    const normalizedPostcode = normalizePostcode(postcode);

    if (!normalizedPostcode) {
      return {
        matched: false,
        income: false,
        health: false,
      };
    }

    try {
      const entry = await this.getFromStore(normalizedPostcode);

      if (!entry) {
        return {
          matched: false,
          income: false,
          health: false,
        };
      }

      return {
        matched: true,
        income: entry.incomeDecile <= DEPRIVATION_THRESHOLD_DECILE,
        health: entry.healthDecile <= DEPRIVATION_THRESHOLD_DECILE,
      };
    } catch (error) {
      console.error("Error reading deprivation data:", error);
      return {
        matched: false,
        income: false,
        health: false,
      };
    }
  }
}

