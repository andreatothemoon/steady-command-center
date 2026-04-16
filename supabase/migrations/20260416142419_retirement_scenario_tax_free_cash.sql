ALTER TABLE public.retirement_scenarios
  ADD COLUMN tax_free_cash_pct NUMERIC NOT NULL DEFAULT 25
  CHECK (tax_free_cash_pct >= 0 AND tax_free_cash_pct <= 25);
