import { runSeed } from "./db/seed";

const subcommand = process.argv[2];

async function main() {
  switch (subcommand) {
    case "seed":
      await runSeed();
      break;
    default:
      console.error(`Unknown subcommand: ${subcommand}`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
