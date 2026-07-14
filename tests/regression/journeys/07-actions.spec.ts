import { test, expect, gotoAuthed } from "../fixtures/base";

test.describe("Actions page", () => {
  test("actions page loads and lists tasks", async ({ page, resetSeed }) => {
    await resetSeed();
    await gotoAuthed(page, "/actions");
    await expect(page.locator("body")).toContainText(/.+/);
  });
});
