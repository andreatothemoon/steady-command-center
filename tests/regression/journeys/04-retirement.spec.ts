import { test, expect, gotoAuthed } from "../fixtures/base";

test.describe("Retirement journey", () => {
  test("renders projections and DB pension", async ({ page, resetSeed }) => {
    await resetSeed();
    await gotoAuthed(page, "/retirement");
    await expect(page.locator("body")).toContainText(/retirement/i);
    // The seeded DB pension is visible somewhere
    await expect(page.locator("body")).toContainText(/career average|test career/i);
  });
});
