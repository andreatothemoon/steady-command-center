# Regression Pack

End-to-end Playwright suite covering every page/journey in the app. Runs as a
dedicated seeded user (`regression@wealthos.test`) so it never touches your
real data.

## Run

```bash
# Full pack (~1–3 min)
bun run regression

# Fast smoke (every route mounts, no console errors) (~15s)
bun run regression:smoke

# Filter to one journey
bun run regression -- --grep assets

# Re-seed the regression household from the DB migration
bun run regression:seed

# Reset test-household data without re-creating the user
bun run regression:reset
```

## Auto-run policy

I (the AI) automatically run `bun run regression:smoke` before claiming any
non-trivial change is done. I run the full pack when a change spans multiple
journeys or touches shared components / RLS / backend.

## Structure

```
tests/regression/
  playwright.config.ts     config, storageState reuse
  globalSetup.ts           safety-checks Supabase URL, signs in once, saves state
  fixtures/base.ts         console-error trap + resetSeed() RPC helper
  smoke/routes.spec.ts     mount every route
  journeys/*.spec.ts       one file per user journey
```

## Adding a new journey

1. Copy an existing spec in `journeys/`.
2. If your journey mutates data, call `await resetSeed()` at the start so
   ordering doesn't matter.
3. Import `test, expect, gotoAuthed` from `../fixtures/base`.
4. Any console error automatically fails the test.

## Safety net

- Global setup **refuses to run** if `VITE_SUPABASE_URL` doesn't match the
  expected dev project. Update the constant in `globalSetup.ts` if you
  legitimately move projects.
- `reset_regression_household()` is a SECURITY DEFINER SQL function that only
  the regression user can call. It only touches rows in the regression
  household — never your data.
- The Google OAuth end-to-end handshake is not exercised (external broker);
  we only assert the button is present.

## What's covered

| # | Journey | Key assertions |
|---|---|---|
| smoke | Every route | Mounts, no console error |
| 01 | Auth | Sign-in form, wrong password error, successful login |
| 02 | Home | Total assets hero, tile grid |
| 03 | Assets | Account list, Add form, Import CSV |
| 04 | Retirement | Projection + DB pension visible |
| 05 | Plan | Loads |
| 06 | Tax | Loads |
| 07 | Actions | Loads |
| 08 | Wealth Map | Nodes render |
| 09 | Profile | Household + members visible |
| 10 | Household | Invite / member surface visible |
| 11 | Admin | Non-admin cannot access `/admin/approvals` |
