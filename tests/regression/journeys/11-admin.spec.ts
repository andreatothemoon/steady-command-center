import { test, expect, gotoAuthed } from "../fixtures/base";

test.describe("Admin approvals", () => {
  test("regression user (non-admin) cannot access admin approvals", async ({ page }) => {
    await gotoAuthed(page, "/admin/approvals");
    // Non-admin users should not see the admin approvals page — should hit NotFound or redirect
    const url = page.url();
    expect(url).not.toMatch(/admin\/approvals/);
  });
});
