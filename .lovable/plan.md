

## Expanded ANI Calculation — Tax Page Redesign

### Current State
The tax page has a simple 4-field form per member: Gross Income, Pension Contributions, ISA Contributions, Capital Gains. ANI is calculated as `Gross Income - Pension Contributions`. The `tax_year_summaries` table stores these fields.

### What Changes

**1. Database migration — expand `tax_year_summaries` columns**

Add new columns to support the granular inputs:
- `salary` (numeric, default 0)
- `bonus` (numeric, default 0)
- `taxable_benefits` (numeric, default 0)
- `salary_sacrifice_pension` (numeric, default 0)
- `employer_pension` (numeric, default 0)
- `personal_pension_net` (numeric, default 0)
- `gift_aid` (numeric, default 0)
- `other_salary_sacrifice` (numeric, default 0)

Keep existing columns (`gross_income`, `pension_contributions`, `adjusted_net_income`) as computed/derived values that get recalculated on save. `isa_contributions` and `capital_gains` remain as-is.

**2. ANI Calculation Logic (in hook + UI)**

```text
Step 1 — Gross Income:
  gross_income = salary + bonus + taxable_benefits
  (salary sacrifice is already excluded from salary by definition,
   but we track it separately for pension allowance purposes)

Step 2 — Deductions:
  salary_sacrifice_total = salary_sacrifice_pension + other_salary_sacrifice
  grossed_up_personal_pension = personal_pension_net × (100/80)
  grossed_up_gift_aid = gift_aid × (100/80)

Step 3 — ANI:
  adjusted_net_income = gross_income
                      - salary_sacrifice_total
                      - grossed_up_personal_pension
                      - grossed_up_gift_aid

Step 4 — Thresholds:
  buffer_100k = max(0, 100000 - ANI)
  buffer_125k = max(0, 125140 - ANI)

Total pension contributions (for allowance tracking):
  pension_contributions = salary_sacrifice_pension
                        + employer_pension
                        + grossed_up_personal_pension
```

**3. Update `useTaxSummaries` hook**

- Expand `MemberFormState` / mutation input to include all new fields
- Compute `gross_income`, `pension_contributions`, and `adjusted_net_income` from the granular inputs before upserting

**4. Redesign Tax Page form**

Replace the flat 4-field grid with structured sections:

```text
┌─ Income ──────────────────────────┐
│  Salary    Bonus    Taxable BIK   │
└───────────────────────────────────┘
┌─ Pension Contributions ───────────┐
│  Salary Sacrifice                 │
│  Employer                         │
│  Personal (net)                   │
└───────────────────────────────────┘
┌─ Other Deductions ────────────────┐
│  Gift Aid                         │
│  Other Salary Sacrifice           │
└───────────────────────────────────┘
┌─ Allowances ──────────────────────┐
│  ISA Contributions                │
│  Capital Gains                    │
└───────────────────────────────────┘
```

**5. ANI output section**

Below the form, show a live calculation breakdown:
- Gross Income (computed)
- Less: Salary Sacrifice
- Less: Grossed-up Personal Pension
- Less: Grossed-up Gift Aid
- **= Adjusted Net Income**
- Distance to £100,000 threshold
- Distance to £125,140 threshold (full personal allowance loss)

Status badges: Safe / Approaching / At Risk for both thresholds.

**6. Update Overview TaxPosition card**

The overview card already reads from `tax_year_summaries` — no changes needed since we'll continue writing `adjusted_net_income` and `pension_contributions` as computed values to the same table.

### Files Changed
- **Migration**: Add 8 new columns to `tax_year_summaries`
- `src/hooks/useTaxSummaries.ts` — expanded form type and ANI calculation
- `src/pages/TaxPage.tsx` — redesigned form with sections + live ANI breakdown
- `src/components/overview/TaxPosition.tsx` — no changes (reads existing columns)

