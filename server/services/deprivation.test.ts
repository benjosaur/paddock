import { expect, test } from "bun:test";

import { DeprivationService } from "./deprivation";

const staticData = new Map([
  ["SW1A1AA", { incomeDecile: 1, healthDecile: 2 }],
  ["BS12AA", { incomeDecile: 5, healthDecile: 5 }],
  ["TA41AA", { incomeDecile: 3, healthDecile: 4 }],
]);

test("returns deprivation flags for a known postcode", async () => {
  const service = new DeprivationService({ staticData });
  const deprivationData = await service.getDeprivationData("SW1A 1AA");

  expect(deprivationData).toEqual({
    matched: true,
    income: true,
    health: true,
  });
});

test("handles postcodes above the deprivation threshold", async () => {
  const service = new DeprivationService({ staticData });
  const deprivationData = await service.getDeprivationData("BS1 2AA");

  expect(deprivationData).toEqual({
    matched: true,
    income: false,
    health: false,
  });
});

test("returns unmatched for missing postcodes", async () => {
  const service = new DeprivationService({ staticData });
  const deprivationData = await service.getDeprivationData("ZZ1 1ZZ");

  expect(deprivationData).toEqual({
    matched: false,
    income: false,
    health: false,
  });
});
