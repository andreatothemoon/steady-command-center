# Regression Pack

End-to-end Playwright suite that walks the app page by page as a dedicated seeded user. One command runs it; I run it automatically after any non-trivial feature change before I tell you I'm done.

## Layout

```text
tests/regression/
  README.md                  how to run, how to extend
  playwright.config.ts       localhost:8080, chromium, 1 worker, video on failure
  seed/
    seed.ts                  idempotent: creates test user, household, members,
                             accounts, DB pension, cash flows, snapshots
    reset.ts                 wipes test-household data (keeps user)
  fixtures/
    auth.ts                  signs in once, reuses storageState for all tests
    testUser.ts              reads REGRESSION_EMAIL / REGRESSION_PASSWORD
  journeys/
    01-auth.spec.ts          sign in, wrong password, sign out, pending-approval page
    02-home.spec.ts          hero net worth, pillar tiles render, quick actions
    03-assets.spec.ts        add / edit / snapshot / CSV import+export / delete account
    04-retirement.spec.ts    scenarios list, projection chart, DB pension edit
    05-plan.spec.ts          plan context save/load, milestones
    06-tax.spec.ts           tax year summary, ANI calculation shows
    07-actions.spec.ts       stale-account action opens, severity colours present
    08-wealth-map.spec.ts    map nodes render, drag reassign
    09-profile.spec.ts       profile edit, NI number gated to owner
    10-household.spec.ts     invite create, invite accept flow (second browser context)
    11-admin-approval.spec.ts  admin sees pending queue, approve/reject
  smoke/
    routes.spec.ts           every route mounts with no console error
snapshots/                   reference screenshots per journey (gitignored artifacts)
```

## Seeded test data

Idempotent SQL migration + a Node seed script that hits the auth admin API through an edge function `seed-regression-user` (service-role only, gated behind `LOVABLE_ENV !== 'production'`).

Seeded fixture:
- User: `regression@wealthos.test` / password from secret
- Household "Regression Household", approved, role `user`
- 3 members: Test Adult A (primary, owner), Test Adult B, Test Child
- 5 accounts: current, ISA, SIPP, mortgage (debt), property
- 1 DB pension with 3 accrual slices
- 6 cash-flow entries across current + prior tax year
- 2 monthly account snapshots

Reset script clears account/pension/cashflow rows for that household so each run starts deterministic. The user itself is preserved to keep the login fast.

## Run modes

- `bun run regression` — full suite, ~2–4 min. Prints pass/fail summary + failing screenshot paths.
- `bun run regression:smoke` — routes-only smoke, ~15 s.
- `bun run regression -- --grep assets` — filter to one journey.
- **Auto-run policy**: after any feature change touching pages, data flow, RLS, or shared components, I run `bun run regression:smoke` before claiming done; I run the full pack when the change spans multiple journeys or backend.

## Secrets

- `REGRESSION_EMAIL` — plain, added to `.env` template
- `REGRESSION_PASSWORD` — stored via `add_secret`, also read from local `.env` for tests
- Seed edge function uses existing `SUPABASE_SERVICE_ROLE_KEY`

## Guardrails

- Suite refuses to run if `VITE_SUPABASE_URL` points at anything other than the dev project (checked in `playwright.config.ts` global setup).
- Every test starts by calling `reset.ts` for the seeded household so ordering doesn't matter.
- Console errors during any journey fail the test (listener attached in `fixtures/auth.ts`).
- Google OAuth is not exercised end-to-end (broker is external); instead the auth journey asserts the button initiates `/~oauth/initiate` and the callback code path is covered by a mocked response.

## Deliverables in this build

1. Playwright config + fixtures + seed edge function + seed/reset scripts
2. All 11 journey specs + smoke spec, each with 3–8 assertions
3. `tests/regression/README.md` explaining run commands, adding new journeys, and the auto-run policy
4. `package.json` scripts: `regression`, `regression:smoke`, `regression:seed`, `regression:reset`
5. First green run captured, failing-test screenshot flow demonstrated

## Out of scope

- Visual/pixel diffing (can add later with `toHaveScreenshot`)
- CI integration (no CI yet; can wire to GitHub Actions when you add one)
- Load/perf testing
- Real Google OAuth exchange (external broker)
