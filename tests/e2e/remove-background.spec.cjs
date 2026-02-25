const fs = require("node:fs/promises");
const path = require("node:path");
const { expect, test } = require("@playwright/test");

const fixturePath = path.resolve("tests/fixtures/person.jpg");

test("upload, remove background, and download PNG", async ({ page }) => {
  await page.goto("/");

  await page.setInputFiles("#imageInput", fixturePath);
  await expect(page.locator("#removeBtn")).toBeEnabled();

  await page.click("#removeBtn");
  await expect(page.locator("#status")).toContainText("Done", { timeout: 25000 });
  await expect(page.locator("#resultPreview")).toHaveAttribute("src", /blob:/);
  await expect(page.locator("#downloadBtn")).toBeEnabled();

  const downloadPromise = page.waitForEvent("download");
  await page.click("#downloadBtn");
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/-no-bg\.png$/i);

  const downloadedPath = await download.path();
  expect(downloadedPath).toBeTruthy();
  const stats = await fs.stat(downloadedPath);
  expect(stats.size).toBeGreaterThan(20);
});

test("shows error state when mock inference is forced to fail", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.__E2E_FORCE_ERROR__ = true;
  });

  await page.setInputFiles("#imageInput", fixturePath);
  await page.click("#removeBtn");

  await expect(page.locator("#status")).toContainText("Error");
  await expect(page.locator("#removeBtn")).toBeEnabled();
  await expect(page.locator("#downloadBtn")).toBeDisabled();
});
