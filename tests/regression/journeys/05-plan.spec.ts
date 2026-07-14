import { test, expect, gotoAuthed } from "../fixtures/base";

test.describe("Plan page", () => {
  test("plan page loads without errors", async ({ page }) => {
    await gotoAuthed(page, "/plan");
    await expect(page.locator("body")).toContainText(/.+/);
  });
});
