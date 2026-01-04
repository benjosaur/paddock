import { expect, test } from "bun:test";
import path from "path";
import { fileURLToPath } from "url";

import { DeprivationService } from "./deprivation";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(
  __dirname,
  "__fixtures__",
  "deprivation-compact.sample.csv"
);

test("returns deprivation flags for a known postcode", async () => {
  const service = new DeprivationService(fixturePath);
  const deprivationData = await service.getDeprivationData("SW1A 1AA");

  expect(deprivationData).toEqual({
    matched: true,
    income: true,
    health: true,
  });
});

test("handles postcodes above the deprivation threshold", async () => {
  const service = new DeprivationService(fixturePath);
  const deprivationData = await service.getDeprivationData("BS1 2AA");

  expect(deprivationData).toEqual({
    matched: true,
    income: false,
    health: false,
  });
});

test("returns unmatched for missing postcodes", async () => {
  const service = new DeprivationService(fixturePath);
  const deprivationData = await service.getDeprivationData("ZZ1 1ZZ");

  expect(deprivationData).toEqual({
    matched: false,
    income: false,
    health: false,
  });
});
