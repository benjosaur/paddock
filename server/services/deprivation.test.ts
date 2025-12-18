import { test, expect } from "bun:test";
import { DeprivationService } from "./deprivation";

test("DeprivationService returns expected fields for a postcode", async () => {
  const service = new DeprivationService();
  const testPostcode = "SW1A 1AA";

  const deprivationData = await service.getDeprivationData(testPostcode);

  console.log("Deprivation data result:", deprivationData);

  // Example assertions — adjust depending on real data structure
  expect(deprivationData).toHaveProperty("income");
  expect(deprivationData).toHaveProperty("health");
});
