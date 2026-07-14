import { test, expect, gotoAuthed } from "../fixtures/base";

/**
 * Smoke: every route mounts without a console error and shows some content.
 * Fast (~15s), the default "did I break anything obvious" check.
 */

const routes = [
  { path: "/", contains: /assets|net worth|household/i },
  { path: "/plan", contains: /.+/ },
  { path: "/retirement", contains: /retirement/i },
  { path: "/wealth", contains: /assets/i },
  { path: "/wealth-map", contains: /map/i },
  { path: "/actions", contains: /.+/ },
  { path: "/tax", contains: /tax/i },
  { path: "/profile", contains: /profile|household/i },
];

for (const r of routes) {
  test(`smoke: ${r.path}`, async ({ page, consoleErrors: _ }) => {
    await gotoAuthed(page, r.path);
    await expect(page.locator("body")).toContainText(r.contains, { timeout: 10_000 });
  });
}
