const path = require("node:path");
const { expect, test } = require("@playwright/test");

const fixturePath = path.resolve("tests/fixtures/person.jpg");

test("real model smoke test: produce downloadable output", async ({ page }) => {
  await page.goto("/");
  await page.setInputFiles("#imageInput", fixturePath);
  await page.click("#removeBtn");

  await expect(page.locator("#status")).toContainText("Done", { timeout: 180000 });
  await expect(page.locator("#downloadBtn")).toBeEnabled();
});
