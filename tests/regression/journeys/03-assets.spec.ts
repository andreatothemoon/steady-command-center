import { test, expect, gotoAuthed } from "../fixtures/base";

test.describe("Assets page (CRUD-ish)", () => {
  test("shows all seeded accounts and total value", async ({ page, resetSeed }) => {
    await resetSeed();
    await gotoAuthed(page, "/wealth");
    await expect(page.getByText("Total assets").first()).toBeVisible();
    for (const name of ["Test Current", "Test ISA", "Test SIPP", "Test Property", "Test Mortgage"]) {
      await expect(page.locator("body")).toContainText(name);
    }
  });

  test("Add Account button opens the add form", async ({ page, resetSeed }) => {
    await resetSeed();
    await gotoAuthed(page, "/wealth");
    await page.getByRole("button", { name: /add account/i }).first().click();
    // Dialog or drawer opens with an input for name
    await expect(page.getByLabel(/name|account name/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("Import CSV button opens importer", async ({ page, resetSeed }) => {
    await resetSeed();
    await gotoAuthed(page, "/wealth");
    await page.getByRole("button", { name: /^import$/i }).first().click();
    await expect(page.locator("body")).toContainText(/csv|upload|paste|import/i);
  });
});
