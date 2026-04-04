
-- Scheme type enum
CREATE TYPE public.db_scheme_type AS ENUM ('CARE', 'FINAL_SALARY');

-- Revaluation type enum
CREATE TYPE public.revaluation_type AS ENUM ('CPI', 'fixed');

-- Indexation type enum
CREATE TYPE public.indexation_type AS ENUM ('CPI', 'capped');

-- Main DB pensions table
CREATE TABLE public.db_pensions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'DB Pension',
  scheme_type public.db_scheme_type NOT NULL DEFAULT 'CARE',
  current_age INTEGER NOT NULL DEFAULT 35,
  retirement_age INTEGER NOT NULL DEFAULT 67,
  current_salary NUMERIC NOT NULL DEFAULT 0,
  salary_growth_rate NUMERIC NOT NULL DEFAULT 0.03,
  accrual_rate NUMERIC NOT NULL DEFAULT 54,
  is_active_member BOOLEAN NOT NULL DEFAULT true,
  revaluation_type public.revaluation_type NOT NULL DEFAULT 'CPI',
  revaluation_rate NUMERIC NOT NULL DEFAULT 0.02,
  revaluation_uplift NUMERIC NOT NULL DEFAULT 0.015,
  indexation_type public.indexation_type NOT NULL DEFAULT 'CPI',
  indexation_cap NUMERIC NOT NULL DEFAULT 0.05,
  existing_income NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Accrual slices table
CREATE TABLE public.db_accrual_slices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pension_id UUID NOT NULL REFERENCES public.db_pensions(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  pension_earned NUMERIC NOT NULL DEFAULT 0,
  revalued_value NUMERIC NOT NULL DEFAULT 0,
  pensionable_salary NUMERIC NOT NULL DEFAULT 0,
  accrual_rate NUMERIC NOT NULL DEFAULT 54,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.db_pensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.db_accrual_slices ENABLE ROW LEVEL SECURITY;

-- RLS policies for db_pensions
CREATE POLICY "Members can manage db pensions"
  ON public.db_pensions
  FOR ALL
  TO authenticated
  USING (is_household_member(auth.uid(), household_id))
  WITH CHECK (is_household_member(auth.uid(), household_id));

-- RLS policies for db_accrual_slices
CREATE POLICY "Members can manage accrual slices"
  ON public.db_accrual_slices
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.db_pensions p
    WHERE p.id = db_accrual_slices.pension_id
    AND p.household_id IN (SELECT get_user_household_ids(auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.db_pensions p
    WHERE p.id = db_accrual_slices.pension_id
    AND p.household_id IN (SELECT get_user_household_ids(auth.uid()))
  ));

-- Updated_at triggers
CREATE TRIGGER update_db_pensions_updated_at
  BEFORE UPDATE ON public.db_pensions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
