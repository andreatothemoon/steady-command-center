-- Revoke direct SELECT and UPDATE on ni_number from public roles
REVOKE SELECT (ni_number) ON public.household_profiles FROM anon, authenticated;
REVOKE UPDATE (ni_number) ON public.household_profiles FROM anon, authenticated;