ALTER TABLE public.retirement_scenarios
  ADD COLUMN tax_free_cash_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN tax_free_cash_age INTEGER;
