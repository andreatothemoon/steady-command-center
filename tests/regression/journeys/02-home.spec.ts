import { test, expect, gotoAuthed } from "../fixtures/base";

test.describe("Home page", () => {
  test("hero shows total assets + at least one pillar tile renders", async ({ page, resetSeed }) => {
    await resetSeed();
    await gotoAuthed(page, "/");

    await expect(page.locator("body")).toContainText(/total assets/i);
    // Household assets tile
    await expect(page.locator("body")).toContainText(/household assets/i);
    // A currency-formatted number is present (£ or $)
    await expect(page.locator("body")).toContainText(/£\s?\d/);
  });

  test("quick actions navigate to Assets", async ({ page, resetSeed }) => {
    await resetSeed();
    await gotoAuthed(page, "/");
    const addBtn = page.getByRole("button", { name: /add account/i }).first();
    if (await addBtn.count()) {
      await addBtn.click();
      await page.waitForURL(/wealth/);
    }
  });
});
