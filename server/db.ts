// import { runAll } from "./db/test";

const subcommand = process.argv[2];

async function main() {
  switch (subcommand) {
    // case "test":
    //   await runAll();
    //   break;
    default:
      console.error(`Unknown subcommand: ${subcommand}`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
