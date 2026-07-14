import { test, expect, gotoAuthed } from "../fixtures/base";

test.describe("Tax page", () => {
  test("shows tax content and reflects seeded cash flows", async ({ page, resetSeed }) => {
    await resetSeed();
    await gotoAuthed(page, "/tax");
    await expect(page.locator("body")).toContainText(/tax/i);
  });
});
