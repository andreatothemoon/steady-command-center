
ALTER TABLE public.tax_year_summaries
  DROP CONSTRAINT tax_year_summaries_household_id_tax_year_key;

CREATE UNIQUE INDEX tax_year_summaries_household_member_year_key
  ON public.tax_year_summaries (household_id, tax_year, COALESCE(member_profile_id, '00000000-0000-0000-0000-000000000000'::uuid));
