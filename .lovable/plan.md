# Home page restructure — WealthOS hub

Reframe the home page as the entry point to the six WealthOS pillars, with a concise hero and one tile per pillar linking to its dedicated page.

## New home page architecture

```text
┌──────────────────────────────────────────────────────────────┐
│  HERO                                                        │
│  Total wealth · household · quick actions                    │
└──────────────────────────────────────────────────────────────┘

┌───────────────┬───────────────┬───────────────┐
│ Household     │ Wealth map    │ Retirement    │
│ wealth        │ (allocation)  │ planning      │
├───────────────┼───────────────┼───────────────┤
│ Life          │ Insights      │ Tax           │
│ planning      │               │               │
└───────────────┴───────────────┴───────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Recommended actions (kept, condensed)                       │
└──────────────────────────────────────────────────────────────┘
```

## Pillar tiles (each links to its detail page)

1. **Household wealth** → `/wealth` — total net worth, delta, member split, top accounts preview. Reuses `AccountsStackCard` styling.
2. **Wealth map** → `/wealth?view=map` — allocation donut (cash / investments / property / pensions) with % split. New small `WealthMapCard` wrapping `AllocationDonut`.
3. **Retirement planning** → `/plan` — projected monthly income, target, readiness %, retire age. Condensed from the current right-column tile.
4. **Life planning** → `/plan?view=scenarios` — scenario modelling entry: active scenario name, "what if" chips (retire earlier, income change, life event). New `LifePlanningCard`.
5. **Insights** → `/actions` — 1-line headline insight (e.g. biggest opportunity), count of open insights. New `InsightsCard`.
6. **Tax** → `/tax` — current tax year, household ANI status (OK / near taper / over taper), ISA allowance used. New `TaxCard`.

## Sections removed / merged from current home

- Standalone `ReadinessCard`, `GuaranteedIncomeCard`, `BridgeGapCard` row → folded into the Retirement tile; details live on `/plan`.
- `IncomeTimeline` chart → moved off home (already on `/plan`).
- `DoMoreCard` → replaced by Life planning tile.
- Right-column retirement plan panel → replaced by Retirement tile.
- `TopActionsCard` (Recommended actions) → kept at bottom, unchanged.

## Files

New:
- `src/components/home/pillars/HouseholdWealthTile.tsx`
- `src/components/home/pillars/WealthMapTile.tsx`
- `src/components/home/pillars/RetirementTile.tsx`
- `src/components/home/pillars/LifePlanningTile.tsx`
- `src/components/home/pillars/InsightsTile.tsx`
- `src/components/home/pillars/TaxTile.tsx`

Edited:
- `src/pages/HomePage.tsx` — new layout: hero + 3×2 pillar grid + recommended actions.

Untouched: detail pages, business logic, hooks, retirement engine.

## Notes

- Presentation-only change; all data comes from existing hooks (`useAccounts`, `useHouseholdProfiles`, `useTaxSummaries`, `useDBPensions`, `useSelectedRetirementScenario`).
- Tiles share a consistent card format: small uppercase eyebrow, headline metric (text-2xl), one line of supporting context, chevron affordance. No gradients.
- Deep links (`?view=map`, `?view=scenarios`) are added as query params; wiring those views inside `/wealth` and `/plan` is out of scope for this pass (tiles still navigate correctly and land on the right page).
