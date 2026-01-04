import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

import { DEPRIVATION_THRESHOLD_DECILE } from "../../shared/const";

interface DeprivationData {
  matched: boolean;
  income: boolean;
  health: boolean;
}

type DeprivationCsvRow = {
  incomeDecile: number;
  healthDecile: number;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_COMPACT_CSV_PATH = path.join(__dirname, "deprivation-compact.csv");

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

export class DeprivationService {
  private dataPromise?: Promise<Map<string, DeprivationCsvRow>>;
  private readonly csvPath: string;

  constructor(csvPath?: string) {
    this.csvPath =
      csvPath ?? process.env.DEPRIVATION_CSV_PATH ?? DEFAULT_COMPACT_CSV_PATH;
  }

  private async loadData(): Promise<Map<string, DeprivationCsvRow>> {
    if (!this.dataPromise) {
      this.dataPromise = this.readCsv();
    }
    return this.dataPromise;
  }

  private async readCsv(): Promise<Map<string, DeprivationCsvRow>> {
    const dataset = new Map<string, DeprivationCsvRow>();
    const resolvedPath = path.resolve(this.csvPath);

    if (!fs.existsSync(resolvedPath)) {
      console.warn(
        `Deprivation compact CSV not found at ${resolvedPath}. Returning empty dataset.`
      );
      return dataset;
    }

    const stream = fs.createReadStream(resolvedPath, { encoding: "utf-8" });
    const reader = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    let headerParsed = false;
    let postcodeIndex = -1;
    let incomeIndex = -1;
    let healthIndex = -1;

    for await (const rawLine of reader) {
      const line = rawLine.trimEnd();
      if (!line) continue;

      const values = parseCsvLine(line);

      if (!headerParsed) {
        const headers = values.map((h) =>
          h.replace(/^"|"$/g, "").toLowerCase()
        );

        postcodeIndex = headers.findIndex((h) => h === "postcode");
        incomeIndex = headers.findIndex(
          (h) => h.includes("income") && h.includes("decile")
        );
        healthIndex = headers.findIndex(
          (h) => h.includes("health") && h.includes("decile")
        );

        if (postcodeIndex === -1 || incomeIndex === -1 || healthIndex === -1) {
          throw new Error(
            "Required columns (postcode, incomeDecile, healthDecile) not found in deprivation CSV"
          );
        }

        headerParsed = true;
        continue;
      }

      const postcode = normalizePostcode(values[postcodeIndex] ?? "");
      const incomeDecile = Number(values[incomeIndex]);
      const healthDecile = Number(values[healthIndex]);

      if (!postcode) continue;
      if (Number.isNaN(incomeDecile) || Number.isNaN(healthDecile)) continue;

      dataset.set(postcode, { incomeDecile, healthDecile });
    }

    return dataset;
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
      const data = await this.loadData();
      const entry = data.get(normalizedPostcode);

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

