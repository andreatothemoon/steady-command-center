import { test, expect, gotoAuthed } from "../fixtures/base";

test.describe("Wealth Map", () => {
  test("map page shows the seeded household and buckets", async ({ page, resetSeed }) => {
    await resetSeed();
    await gotoAuthed(page, "/wealth-map");
    await expect(page.locator("body")).toContainText(/wealth map/i);
    await expect(page.locator("body")).toContainText(/test adult a/i);
    // Bucket labels are always visible; individual accounts are gated behind expand
    await expect(page.locator("body")).toContainText(/growth|property|guaranteed|safety net/i);
  });
});
