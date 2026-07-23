import { chromium, request, type FullConfig } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Global setup:
 *  1. Refuses to run against a non-dev Supabase project (safety net).
 *  2. Signs the regression user in via Supabase auth REST once.
 *  3. Reuses that storage state for every subsequent test (no per-test login).
 *
 * The regression user + seed data is created by a migration (see
 * 20260714_regression_seed migration). Tests call `supabase.rpc('reset_regression_household')`
 * as needed to reset state.
 */

export const REGRESSION_EMAIL = "regression@wealthos.test";
export const REGRESSION_PASSWORD = "RegressionTest2026!";

// Only allow the dev Supabase project. Change this if you fork the project.
const EXPECTED_SUPABASE_URL = "https://yrqtpipcnolxvzostbae.supabase.co";

export default async function globalSetup(_config: FullConfig) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? readEnvFile("VITE_SUPABASE_URL");
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? readEnvFile("VITE_SUPABASE_PUBLISHABLE_KEY");

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. Ensure .env is present.");
  }
  if (supabaseUrl !== EXPECTED_SUPABASE_URL) {
    throw new Error(
      `Regression pack refuses to run against ${supabaseUrl}. ` +
        `Expected ${EXPECTED_SUPABASE_URL}. Update globalSetup.ts if the project ref changed.`,
    );
  }

  // 0. Ensure the test user is provisioned (idempotent, admin-API-backed).
  const seedToken = process.env.SEED_ADMIN_TOKEN;
  if (!seedToken) {
    throw new Error("Missing SEED_ADMIN_TOKEN env var required to provision the regression user.");
  }
  const provisionCtx = await request.newContext();
  const provisionRes = await provisionCtx.post(
    `${supabaseUrl}/functions/v1/provision-regression-user`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "x-seed-admin-token": seedToken,
      },
      data: {},
    },
  );
  if (!provisionRes.ok()) {
    throw new Error(`Provisioning regression user failed: ${provisionRes.status()} ${await provisionRes.text()}`);
  }
  await provisionCtx.dispose();

  // Sign in via REST → grab tokens → write Playwright storageState + localStorage seed.
  const ctx = await request.newContext();
  const res = await ctx.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    data: { email: REGRESSION_EMAIL, password: REGRESSION_PASSWORD },
  });
  if (!res.ok()) {
    throw new Error(`Regression sign-in failed: ${res.status()} ${await res.text()}`);
  }
  const session = await res.json();
  await ctx.dispose();

  // The Supabase JS client reads sb-<ref>-auth-token from localStorage.
  const ref = new URL(supabaseUrl).hostname.split(".")[0];
  const storageKey = `sb-${ref}-auth-token`;
  const persistedSession = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type,
    user: session.user,
  };

  const authDir = path.resolve(__dirname, ".auth");
  fs.mkdirSync(authDir, { recursive: true });

  // Boot a browser to install the localStorage item at the app origin, then save state.
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const baseURL = process.env.REGRESSION_BASE_URL ?? "http://localhost:8080";
  await page.goto(baseURL);
  await page.evaluate(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: storageKey, value: JSON.stringify(persistedSession) },
  );
  await context.storageState({ path: path.join(authDir, "regression.json") });
  await browser.close();

  // Expose values for tests
  process.env.REGRESSION_SUPABASE_URL = supabaseUrl;
  process.env.REGRESSION_SUPABASE_ANON = anonKey;
  process.env.REGRESSION_ACCESS_TOKEN = session.access_token;
  process.env.REGRESSION_USER_ID = session.user.id;
}

function readEnvFile(key: string): string | undefined {
  try {
    const envPath = path.resolve(__dirname, "../../.env");
    const raw = fs.readFileSync(envPath, "utf8");
    const line = raw.split("\n").find((l) => l.startsWith(`${key}=`));
    return line?.split("=").slice(1).join("=").trim().replace(/^"|"$/g, "");
  } catch {
    return undefined;
  }
}
