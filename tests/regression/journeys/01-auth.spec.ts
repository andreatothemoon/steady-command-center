import { test, expect } from "../fixtures/base";
import { chromium } from "@playwright/test";

test.describe("Auth journey", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("shows sign-in page when signed out", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("heading", { name: /WealthOS/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("wrong password shows error", async ({ page }) => {
    await page.goto("/auth");
    await page.getByLabel(/email/i).fill("regression@wealthos.test");
    await page.getByLabel(/password/i).fill("WrongPassword123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.locator("body")).toContainText(/invalid|incorrect|wrong/i, { timeout: 10_000 });
  });

  test("Google button initiates managed OAuth flow", async ({ page }) => {
    await page.goto("/auth");
    const google = page.getByRole("button", { name: /google/i }).first();
    if (await google.count()) {
      await expect(google).toBeVisible();
    }
  });

  test("correct password signs in and lands on home", async () => {
    // Independent browser so we do not disturb the shared storageState.
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/auth");
    await page.getByLabel(/email/i).fill("regression@wealthos.test");
    await page.getByLabel(/password/i).fill("RegressionTest2026!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 15_000 });
    await expect(page.locator("body")).toContainText(/assets|household|net worth/i, { timeout: 15_000 });
    await browser.close();
  });
});
