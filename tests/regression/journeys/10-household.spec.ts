import { test, expect, gotoAuthed } from "../fixtures/base";

test.describe("Household management", () => {
  test("household section is visible in profile", async ({ page, resetSeed }) => {
    await resetSeed();
    await gotoAuthed(page, "/profile");
    await expect(page.locator("body")).toContainText(/household|invite|member/i);
  });
});
