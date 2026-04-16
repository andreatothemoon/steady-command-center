ALTER TABLE public.retirement_scenarios
  ADD COLUMN isa_bridge_income_annual NUMERIC NOT NULL DEFAULT 0 CHECK (isa_bridge_income_annual >= 0),
  ADD COLUMN property_income_annual NUMERIC NOT NULL DEFAULT 0 CHECK (property_income_annual >= 0),
  ADD COLUMN part_time_income_annual NUMERIC NOT NULL DEFAULT 0 CHECK (part_time_income_annual >= 0);
