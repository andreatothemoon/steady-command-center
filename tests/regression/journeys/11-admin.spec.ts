import { test, expect, gotoAuthed } from "../fixtures/base";

test.describe("Admin approvals", () => {
  test("regression user (non-admin) sees no pending approvals", async ({ page }) => {
    await gotoAuthed(page, "/admin/approvals");
    // RLS should hide all approval rows from non-admin users.
    await expect(page.locator("body")).toContainText(/no user signups yet/i, { timeout: 10_000 });
  });
});
