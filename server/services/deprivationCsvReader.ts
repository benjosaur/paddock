import * as fs from "fs";
import * as path from "path";

import { fileURLToPath } from "url";

// ES Module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DeprivationData {
  postcode: string;
  lsoaCode: string;
  ladCode: string;
  lsoaName: string;
  ladName: string;
  lsoa: {
    imdRank: number;
    incomeRank: number;
    employmentRank: number;
    educationRank: number;
    healthRank: number;
    crimeRank: number;
    barriersToHousingRank: number;
    livingEnvironmentRank: number;
    idaciRank: number;
    idaopiRank: number;
    imdDecile: number;
    incomeDecile: number;
    employmentDecile: number;
    educationDecile: number;
    healthDecile: number;
    crimeDecile: number;
    barriersToHousingDecile: number;
    livingEnvironmentDecile: number;
    idaciDecile: number;
    idaopiDecile: number;
  };
  lad: {
    imdRankOfAvgRank: number;
    incomeRankOfAvgRank: number;
    employmentRankOfAvgRank: number;
    educationRankOfAvgRank: number;
    healthRankOfAvgRank: number;
    crimeRankOfAvgRank: number;
    barriersToHousingRankOfAvgRank: number;
    livingEnvironmentRankOfAvgRank: number;
    idaciRankOfAvgRank: number;
    idaopiRankOfAvgRank: number;
  };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseRow(values: string[]): DeprivationData {
  return {
    postcode: values[0],
    lsoaCode: values[1],
    ladCode: values[2],
    lsoaName: values[3],
    ladName: values[4],
    lsoa: {
      imdRank: parseInt(values[5], 10),
      incomeRank: parseInt(values[6], 10),
      employmentRank: parseInt(values[7], 10),
      educationRank: parseInt(values[8], 10),
      healthRank: parseInt(values[9], 10),
      crimeRank: parseInt(values[10], 10),
      barriersToHousingRank: parseInt(values[11], 10),
      livingEnvironmentRank: parseInt(values[12], 10),
      idaciRank: parseInt(values[13], 10),
      idaopiRank: parseInt(values[14], 10),
      imdDecile: parseInt(values[15], 10),
      incomeDecile: parseInt(values[16], 10),
      employmentDecile: parseInt(values[17], 10),
      educationDecile: parseInt(values[18], 10),
      healthDecile: parseInt(values[19], 10),
      crimeDecile: parseInt(values[20], 10),
      barriersToHousingDecile: parseInt(values[21], 10),
      livingEnvironmentDecile: parseInt(values[22], 10),
      idaciDecile: parseInt(values[23], 10),
      idaopiDecile: parseInt(values[24], 10),
    },
    lad: {
      imdRankOfAvgRank: parseInt(values[25], 10),
      incomeRankOfAvgRank: parseInt(values[26], 10),
      employmentRankOfAvgRank: parseInt(values[27], 10),
      educationRankOfAvgRank: parseInt(values[28], 10),
      healthRankOfAvgRank: parseInt(values[29], 10),
      crimeRankOfAvgRank: parseInt(values[30], 10),
      barriersToHousingRankOfAvgRank: parseInt(values[31], 10),
      livingEnvironmentRankOfAvgRank: parseInt(values[32], 10),
      idaciRankOfAvgRank: parseInt(values[33], 10),
      idaopiRankOfAvgRank: parseInt(values[34], 10),
    },
  };
}

export async function readDeprivationCSV(): Promise<DeprivationData[]> {
  const csvPath = path.join(
    __dirname,
    "Indices_of_Deprivation-2025-data_download-file-postcode_join.csv"
  );

  const fileContent = fs.readFileSync(csvPath, "utf-8");
  const lines = fileContent.split("\n").filter((line) => line.trim() !== "");

  // Skip header row
  const dataLines = lines.slice(1);

  const data: DeprivationData[] = dataLines.map((line) => {
    const values = parseCSVLine(line);
    return parseRow(values);
  });

  return data;
}

export function findByPostcode(
  data: DeprivationData[],
  postcode: string
): DeprivationData | undefined {
  const normalizedPostcode = postcode.replace(/\s+/g, "").toUpperCase();
  return data.find(
    (row) =>
      row.postcode.replace(/\s+/g, "").toUpperCase() === normalizedPostcode
  );
}

export function filterByLAD(
  data: DeprivationData[],
  ladName: string
): DeprivationData[] {
  return data.filter(
    (row) => row.ladName.toLowerCase() === ladName.toLowerCase()
  );
}

export function filterByIMDDecile(
  data: DeprivationData[],
  decile: number
): DeprivationData[] {
  return data.filter((row) => row.lsoa.imdDecile === decile);
}

// Example usage
async function main() {
  try {
    console.log("Reading deprivation data...");
    const data = await readDeprivationCSV();
    console.log(`Loaded ${data.length} records`);

    if (data.length > 0) {
      console.log("\nFirst record:");
      console.log(JSON.stringify(data[0], null, 2));
    }
  } catch (error) {
    console.error("Error reading CSV:", error);
  }
}

// Run if executed directly
main();

export type { DeprivationData };
