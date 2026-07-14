import { test, expect, gotoAuthed } from "../fixtures/base";

test.describe("Admin approvals", () => {
  test("regression user (non-admin) cannot access admin approvals", async ({ page }) => {
    await gotoAuthed(page, "/admin/approvals");
    // Non-admin users hit the 404 page.
    await expect(page.locator("body")).toContainText(/404|not found/i, { timeout: 10_000 });
  });
});
