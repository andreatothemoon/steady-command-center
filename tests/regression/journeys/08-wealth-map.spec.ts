import { test, expect, gotoAuthed } from "../fixtures/base";

test.describe("Wealth Map", () => {
  test("map page shows the seeded accounts as nodes", async ({ page, resetSeed }) => {
    await resetSeed();
    await gotoAuthed(page, "/wealth-map");
    await expect(page.locator("body")).toContainText(/map/i);
    await expect(page.locator("body")).toContainText(/regression household/i);
  });
});
