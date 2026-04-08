
-- Revoke direct SELECT and UPDATE on ni_number column from authenticated and anon roles
REVOKE SELECT (ni_number) ON public.household_profiles FROM authenticated, anon;
REVOKE UPDATE (ni_number) ON public.household_profiles FROM authenticated, anon;
