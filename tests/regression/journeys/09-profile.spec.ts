import { test, expect, gotoAuthed } from "../fixtures/base";

test.describe("Profile / Household", () => {
  test("profile page shows household name and members", async ({ page, resetSeed }) => {
    await resetSeed();
    await gotoAuthed(page, "/profile");
    await expect(page.locator("body")).toContainText(/regression household/i);
    await expect(page.locator("body")).toContainText(/test adult a/i);
  });
});
