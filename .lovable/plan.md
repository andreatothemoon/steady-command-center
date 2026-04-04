

## Fix ANI to Per-Person Thresholds

### Problem
ANI is currently summed across all household members and compared against a single £100,000 threshold. This is wrong — the £100k threshold applies **per person**. If two adults each earn £80k, the current code shows £160k "Over £100k" when both are actually safe.

### What Changes

**1. `src/pages/OverviewPage.tsx`**
- Stop computing a single summed `ani`. Instead, compute per-member ANI values from `taxSummaries` using `computeANI`.
- Pass an array of per-member ANI results (or the worst-case member's ANI + member name) to `TaxPosition` and `ActionCenter`.
- ISA and pension allowances remain household-aggregated (that's correct).

**2. `src/components/overview/TaxPosition.tsx`**
- Change props from a single `ani: number` to `memberANIs: { name: string; ani: number; pensionContributions: number }[]`.
- Show the **highest ANI member** as the headline figure with their name (e.g., "Andrea: £95,000").
- Status badge reflects the worst-case member (whoever is closest to or over £100k).
- If multiple members are at risk, show each one.
- ISA/Pension bars remain household-level (unchanged).
- Insight text references the specific member who needs action.

**3. `src/components/ActionCenter.tsx`**
- Change `ani` prop to `memberANIs: { name: string; ani: number }[]`.
- Generate ANI alerts **per member** — e.g., "Andrea's ANI approaching £100k" or "Andrea's ANI exceeds £100k".
- Each member who is approaching or over threshold gets their own action item.

**4. `src/pages/TaxPage.tsx`**
- Household view: Replace "Combined Household ANI" hero with a per-member ANI summary. Show each adult's ANI individually with their own status badge (safe/warning/danger vs £100k).
- Remove the summed `getHouseholdANI()` function.
- The `aniWarning` flag becomes true if **any** adult is over £100k.

**5. `src/components/tax/ANIBreakdown.tsx`**
- No structural changes needed — it already works per-member.

### Files Changed
- `src/pages/OverviewPage.tsx` — compute per-member ANIs, pass to children
- `src/components/overview/TaxPosition.tsx` — per-member ANI display
- `src/components/ActionCenter.tsx` — per-member ANI alerts
- `src/pages/TaxPage.tsx` — household view shows individual ANIs

