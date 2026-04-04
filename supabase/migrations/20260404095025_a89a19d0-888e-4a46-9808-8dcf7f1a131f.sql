
ALTER TABLE public.tax_year_summaries
  ADD COLUMN salary numeric DEFAULT 0,
  ADD COLUMN bonus numeric DEFAULT 0,
  ADD COLUMN taxable_benefits numeric DEFAULT 0,
  ADD COLUMN salary_sacrifice_pension numeric DEFAULT 0,
  ADD COLUMN employer_pension numeric DEFAULT 0,
  ADD COLUMN personal_pension_net numeric DEFAULT 0,
  ADD COLUMN gift_aid numeric DEFAULT 0,
  ADD COLUMN other_salary_sacrifice numeric DEFAULT 0;
