

## Add Dividend Income to Tax Page

### What Changes

**1. Database migration** — add `dividend_income` column to `tax_year_summaries`
- `dividend_income` (numeric, default 0, nullable)

**2. Update `useTaxSummaries.ts`**
- Add `dividend_income` to `MemberFormState` and `emptyForm`
- Add to `summaryToForm` mapping
- Update `computeANI`: include `dividend_income` in `gross_income` calculation: `salary + bonus + taxable_benefits + dividend_income`
- Include `dividend_income` in the upsert mutation payload

**3. Update `ANIBreakdown.tsx`**
- Show dividend income as a separate line in the gross income breakdown (if > 0)

**4. Update `TaxPage.tsx`**
- Add a "Dividend Income" field in the Income section (edit form) — 4th field in the grid alongside Salary, Bonus, Taxable BIK
- Add a "Dividends" read-only field in the Income section display
- Available for each adult member (hidden for children, same as other income fields)

### Files Changed
- **Migration**: Add `dividend_income` column
- `src/hooks/useTaxSummaries.ts` — form state + ANI calc
- `src/components/tax/ANIBreakdown.tsx` — show dividend line
- `src/pages/TaxPage.tsx` — input field in both edit and read-only views

