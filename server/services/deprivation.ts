import { GetCommand } from "@aws-sdk/lib-dynamodb";

import { DEPRIVATION_THRESHOLD_DECILE } from "../../shared/const";
import { client } from "../db/repository";

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
  staticData?: Map<string, DeprivationRecord>; // for tests or fallback
};

const DEFAULT_TABLE = process.env.DEPRIVATION_TABLE ?? "DeprivationCompact";

function normalizePostcode(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export class DeprivationService {
  private readonly staticData?: Map<string, DeprivationRecord>;

  constructor(options: DeprivationServiceOptions = {}) {
    this.staticData = options.staticData;
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
      const entry = await this.getFromStore(normalizedPostcode, postcode);

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

  private async getFromStore(
    postcode: string,
    rawPostcode?: string
  ): Promise<DeprivationRecord | undefined> {
    if (this.staticData) {
      return this.staticData.get(postcode);
    }
    const result = await client.send(
      new GetCommand({
        TableName: DEFAULT_TABLE,
        Key: { postcode },
      })
    );

    if (result.Item) {
      const incomeDecile = Number(result.Item.incomeDecile);
      const healthDecile = Number(result.Item.healthDecile);

      if (!Number.isNaN(incomeDecile) && !Number.isNaN(healthDecile)) {
        return { incomeDecile, healthDecile };
      }
    }

    // Fallback: if data was inserted without stripping spaces, try the raw uppercase value
    const rawKey =
      rawPostcode?.toUpperCase().trim() === postcode
        ? undefined
        : rawPostcode?.toUpperCase().trim();
    if (rawKey) {
      const fallback = await client.send(
        new GetCommand({
          TableName: DEFAULT_TABLE,
          Key: { postcode: rawKey },
        })
      );
      if (fallback.Item) {
        const incomeDecile = Number(fallback.Item.incomeDecile);
        const healthDecile = Number(fallback.Item.healthDecile);
        if (!Number.isNaN(incomeDecile) && !Number.isNaN(healthDecile)) {
          return { incomeDecile, healthDecile };
        }
      }
    }

    return undefined;
  }
}
