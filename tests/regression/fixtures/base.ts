import { test as base, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Base test fixture:
 *  - Fails any test that logs a console error
 *  - Exposes a `resetSeed` helper that calls the SECURITY DEFINER RPC to
 *    reset the regression household back to canonical data
 */

type Fixtures = {
  consoleErrors: string[];
  resetSeed: () => Promise<void>;
};

export const test = base.extend<Fixtures>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // Filter noisy 3rd-party warnings we can't fix
        if (/favicon|Download the React DevTools|ResizeObserver loop/i.test(text)) return;
        errors.push(text);
      }
    });
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
    await use(errors);
    if (errors.length) {
      throw new Error(`Console errors during test:\n  - ${errors.join("\n  - ")}`);
    }
  },

  resetSeed: async ({}, use) => {
    const supabaseUrl = process.env.REGRESSION_SUPABASE_URL!;
    const anonKey = process.env.REGRESSION_SUPABASE_ANON!;
    const seedToken = process.env.SEED_ADMIN_TOKEN;

    async function reset() {
      const res = await fetch(`${supabaseUrl}/functions/v1/provision-regression-user`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          "Content-Type": "application/json",
          ...(seedToken ? { "x-seed-admin-token": seedToken } : {}),
        },
        body: "{}",
      });
      if (!res.ok) {
        throw new Error(`resetSeed failed: ${res.status} ${await res.text()}`);
      }
    }

    await use(reset);
  },
});

export { expect };

export async function gotoAuthed(page: Page, route: string) {
  await page.goto(route);
  // Wait for the app shell to render (sidebar exists on all authed routes)
  await page.waitForSelector("nav, aside, [data-app-shell]", { timeout: 10_000 }).catch(() => {});
}

export function screenshotDir() {
  const dir = path.resolve(__dirname, "../screenshots");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
