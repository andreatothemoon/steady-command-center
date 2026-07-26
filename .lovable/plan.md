## Goal

Persist life events in the database. Today the Plan page keeps them in memory only (`src/planning/store/PlanContext.tsx` + seed), so nothing survives a reload or syncs across household members. User data is already covered by `household_profiles`, and assets by `accounts` — the missing piece is **life events**.

## Current state (verified)

- `households`, `household_members`, `household_profiles` — user/household data ✅
- `accounts`, `cash_flows`, `db_pensions`, `holdings` — assets & flows ✅
- Retirement scenarios persisted in `retirement_scenarios` ✅
- Life events: **only in-memory** in `src/planning/store/PlanContext.tsx`, seeded from `src/planning/store/seed.ts`. No table exists.

The in-memory model (`PlanEvent` in `src/planning/types.ts`) has: title, type, date, probability, status, notes, scenarioId, optional decisionId, and a list of `FinancialEffect` rows (kind, amount, frequency, start/end year, label).

## Proposed schema

Two new tables in `public`, scoped by household with RLS via existing `is_household_member` helper.

### 1. `life_events`
- `household_id` → `households(id)` on delete cascade
- `scenario_id` uuid (nullable — nullable because current Plan scenarios live client-side; ties in later if we persist scenarios)
- `profile_id` → `household_profiles(id)` nullable (optional: whose event)
- `title` text
- `event_type` text (enum-like: matches `EventType` union — home_purchase, child, retirement, etc.)
- `event_date` date
- `probability` numeric default 1.0 (0–1)
- `status` text default 'planned' ('planned' | 'confirmed' | 'cancelled')
- `notes` text nullable
- `decision_id` uuid nullable (future link)
- standard `created_at` / `updated_at` with trigger

### 2. `life_event_effects`
- `event_id` → `life_events(id)` on delete cascade
- `kind` text ('cash_delta' | 'recurring_income' | 'recurring_expense' | 'asset_delta' | 'liability_delta' | 'salary_delta' | 'pension_contribution_delta')
- `amount` numeric (GBP, signed)
- `frequency` text nullable ('monthly' | 'annual' | 'one_off')
- `start_year` int
- `end_year` int nullable
- `label` text
- timestamps

### RLS
Household members can select/insert/update/delete their own household's events and effects (via `is_household_member(auth.uid(), household_id)` — effects check through parent event). Standard grants to `authenticated` + `service_role`. No anon.

## Not in this plan

- Frontend wiring (hook `useLifeEvents`, replacing `PlanContext` seed with DB fetch, mutations from `TimelineEventEditor`) — I'll do that in a follow-up once you confirm the shape.
- Migrating existing seed events into real rows.
- Linking to `retirement_scenarios` (kept as free-text uuid for now to avoid coupling with the client-side Plan scenario store).

## Deliverable

One migration creating both tables with grants, RLS, policies, and `updated_at` triggers. After you approve, I'll switch to build mode and run it.
