import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type CliOptions = {
  input: string;
  output: string;
  postcodes?: Set<string>;
};

const DEFAULT_INPUT = path.resolve(
  __dirname,
  "../services/Indices_of_Deprivation-2025-data_download-file-postcode_join.csv"
);
const DEFAULT_OUTPUT = path.resolve(
  __dirname,
  "../services/deprivation-compact.csv"
);

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

function parsePostcodes(
  inline?: string,
  filePath?: string
): Set<string> | undefined {
  const normalized = new Set<string>();

  if (inline) {
    inline
      .split(",")
      .map((pc) => pc.trim())
      .filter(Boolean)
      .forEach((pc) => normalized.add(normalizePostcode(pc)));
  }

  if (filePath) {
    const contents = fs.readFileSync(path.resolve(filePath), "utf-8");
    contents
      .split(/\r?\n/)
      .map((pc) => pc.trim())
      .filter(Boolean)
      .forEach((pc) => normalized.add(normalizePostcode(pc)));
  }

  return normalized.size > 0 ? normalized : undefined;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  let input = DEFAULT_INPUT;
  let output = DEFAULT_OUTPUT;
  let inlinePostcodes: string | undefined;
  let postcodeFile: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--input":
        input = args[++i];
        break;
      case "--output":
        output = args[++i];
        break;
      case "--postcodes":
        inlinePostcodes = args[++i];
        break;
      case "--postcodes-file":
        postcodeFile = args[++i];
        break;
      case "--help":
        printUsage();
        process.exit(0);
      default:
        console.warn(`Unknown argument "${arg}" ignored`);
    }
  }

  return {
    input: path.resolve(input),
    output: path.resolve(output),
    postcodes: parsePostcodes(inlinePostcodes, postcodeFile),
  };
}

function printUsage(): void {
  console.log(`
Preprocess the 500MB deprivation CSV into a compact file with only the
columns the service needs. Defaults assume the source CSV lives in
server/services/ and writes server/services/deprivation-compact.csv

Options:
  --input <path>           Path to the original CSV
  --output <path>          Path for the compact CSV
  --postcodes <list>       Comma-separated list of postcodes to keep
  --postcodes-file <path>  File with one postcode per line to keep
  --help                   Show this help
`);
}

async function preprocess(): Promise<void> {
  const { input, output, postcodes } = parseArgs();

  if (!fs.existsSync(input)) {
    throw new Error(`Input CSV not found at ${input}`);
  }

  fs.mkdirSync(path.dirname(output), { recursive: true });

  const inputStream = fs.createReadStream(input, { encoding: "utf-8" });
  const reader = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  });

  const writer = fs.createWriteStream(output, { encoding: "utf-8" });

  let headerParsed = false;
  let postcodeIndex = -1;
  let incomeIndex = -1;
  let healthIndex = -1;
  let totalRows = 0;
  let writtenRows = 0;

  for await (const rawLine of reader) {
    const line = rawLine.trimEnd();
    if (!line) continue;

    const values = parseCsvLine(line);

    if (!headerParsed) {
      const headers = values.map((h) => h.replace(/^"|"$/g, "").toLowerCase());

      postcodeIndex = headers.findIndex((h) => h === "postcode");
      incomeIndex = headers.findIndex((h) => h.includes("income decile"));
      healthIndex = headers.findIndex(
        (h) => h.includes("health deprivation") && h.includes("decile")
      );

      if (postcodeIndex === -1 || incomeIndex === -1 || healthIndex === -1) {
        throw new Error("Required columns not found in input CSV");
      }

      writer.write("postcode,incomeDecile,healthDecile\n");
      headerParsed = true;
      continue;
    }

    totalRows += 1;

    const postcodeRaw = values[postcodeIndex];
    const incomeRaw = values[incomeIndex];
    const healthRaw = values[healthIndex];

    if (!postcodeRaw || incomeRaw === undefined || healthRaw === undefined) {
      continue;
    }

    const normalizedPostcode = normalizePostcode(postcodeRaw);
    if (postcodes && !postcodes.has(normalizedPostcode)) {
      continue;
    }

    const incomeDecile = Number(incomeRaw);
    const healthDecile = Number(healthRaw);

    if (Number.isNaN(incomeDecile) || Number.isNaN(healthDecile)) {
      continue;
    }

    writer.write(`${normalizedPostcode},${incomeDecile},${healthDecile}\n`);
    writtenRows += 1;
  }

  writer.end();
  await new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(undefined));
    writer.on("error", reject);
  });

  console.log(
    `Wrote ${writtenRows} rows (from ${totalRows}) to ${output}${
      postcodes ? `, filtered to ${postcodes.size} postcode(s)` : ""
    }`
  );
}

preprocess().catch((error) => {
  console.error("Failed to preprocess deprivation CSV:", error);
  process.exit(1);
});
